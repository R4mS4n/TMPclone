const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
  try {
    const [users] = await db
      .promise()
      .query('SELECT * FROM User');

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

const getHonorLeaderboard = async (req, res) => {
  try {
    const [leaderboard] = await db
      .promise()
      .query(
        `SELECT 
           u.user_id,
           u.username,
           CONVERT(u.profile_pic USING utf8) AS profile_pic,
           uht.honor_points
         FROM User_Honor_Total uht
         JOIN User u ON uht.user_id = u.user_id
         ORDER BY uht.honor_points DESC
         LIMIT 10`
      );

    res.json({
      success: true,
      count: leaderboard.length,
      leaderboard
    });
  } catch (error) {
    console.error('getHonorLeaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch honor leaderboard'
    });
  }
};

const checkUserEnrollments = async (req, res) => {
  try {
    const userId = req.user.sub;
    const [enrollments] = await db
      .promise()
      .query(
        `SELECT 
           t.tournament_id AS challenge_id,
           t.name            AS challenge_name,
           t.description,
           tp.score
         FROM Tournament_Participation tp
         JOIN Tournament t ON tp.tournament_id = t.tournament_id
         WHERE tp.user_id = ?`,
        [userId]
      );

    res.json({
      success: true,
      count: enrollments.length,
      enrollments
    });
  } catch (error) {
    console.error('checkUserEnrollments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enrollments'
    });
  }
};

const { hasPermission } = require('../middleware/authMiddleware');

const updateUserByAdmin = async (req, res) => {
  const editor = req.user; // usuario autenticado
  const targetUserId = req.params.id;
  const { username, mail, role } = req.body;

  try {
    const [targetRows] = await db.promise().query('SELECT role FROM User WHERE user_id = ?', [targetUserId]);
    if (!targetRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const targetRole = targetRows[0].role;
    if (!hasPermission(editor.role, targetRole)) {
      return res.status(403).json({ error: 'No tienes permiso para editar este usuario' });
    }

    // Si el que edita es superadmin, puede modificar el rol
    if (editor.role === 2 && typeof role !== 'undefined') {
      await db.promise().query(
        'UPDATE User SET username = ?, mail = ?, role = ? WHERE user_id = ?',
        [username, mail, role, targetUserId]
      );
    } else {
      await db.promise().query(
        'UPDATE User SET username = ?, mail = ? WHERE user_id = ?',
        [username, mail, targetUserId]
      );
    }

    return res.json({ success: true, message: 'Usuario actualizado' });

  } catch (error) {
    console.error('updateUserByAdmin error:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};


// 🗑️ Eliminar usuario (admin puede borrar solo a users, superadmin puede borrar a cualquiera)
const deleteUserByAdmin = async (req, res) => {
  const editor = req.user;
  const targetUserId = req.params.id;

  try {
    const [targetRows] = await db.promise().query('SELECT role FROM User WHERE user_id = ?', [targetUserId]);
    if (!targetRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const targetRole = targetRows[0].role;
    if (!hasPermission(editor.role, targetRole)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este usuario' });
    }

    await db.promise().query('DELETE FROM User WHERE user_id = ?', [targetUserId]);

    return res.json({ success: true, message: 'Usuario eliminado correctamente' });

  } catch (error) {
    console.error('deleteUserByAdmin error:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

const updateUserRole = async (req, res) => {
  const editor = req.user;
  const targetUserId = req.params.id;
  const { role } = req.body;

  if (editor.role < 2) {
    return res.status(403).json({ error: 'Solo los SuperAdmins pueden cambiar roles' });
  }

  if (![0, 1].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido (solo 0 o 1 permitidos)' });
  }

  try {
    const [rows] = await db.promise().query('SELECT * FROM User WHERE user_id = ?', [targetUserId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await db.promise().query(
      'UPDATE User SET role = ? WHERE user_id = ?',
      [role, targetUserId]
    );

    return res.json({ success: true, message: 'Rol actualizado correctamente' });
  } catch (error) {
    console.error('updateUserRole error:', error);
    return res.status(500).json({ error: 'Error al actualizar rol' });
  }
};


module.exports = {
  getAllUsers,
  getHonorLeaderboard,
  checkUserEnrollments,
  updateUserByAdmin,
  updateUserRole,
  deleteUserByAdmin
};
