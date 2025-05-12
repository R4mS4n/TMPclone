// controllers/adminController.js

const db = require('../config/db');

/**
 * Listar todos los usuarios que NO sean admins (role = 0)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT 
         user_id, username, mail, xp, level, team_id, role
       FROM \`User\`
       WHERE role = ?`,
      [0]
    );

    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('adminController.getAllUsers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
};

/**
 * Actualizar el username de un usuario (solo role = 0)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Falta el nuevo username'
      });
    }

    const [result] = await db.promise().query(
      `UPDATE \`User\`
       SET username = ?
       WHERE user_id = ? AND role = ?`,
      [username, id, 0]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado o no editable'
      });
    }

    return res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('adminController.updateUser error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario'
    });
  }
};

/**
 * Borrar un usuario (solo role = 0)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.promise().query(
      `DELETE FROM \`User\`
       WHERE user_id = ? AND role = ?`,
      [id, 0]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado o no borrable'
      });
    }

    return res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('adminController.deleteUser error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario'
    });
  }
};
