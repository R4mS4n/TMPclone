const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { hasPermission } = require('../middleware/authMiddleware');

//storage for caching profile pics
const storage = multer.diskStorage({
  destination: 'uploads/profile-pics/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.user.sub}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});
//upload pfps
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

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
    const [enrollments] = await db.promise().query(
        `SELECT 
           t.tournament_id AS challenge_id,
           t.name            AS challenge_name,
           t.description,
           tp.score
         FROM Tournament_Participation tp
         JOIN Tournament t ON tp.tournament_id = t.tournament_id
         WHERE tp.user_id = ?
          AND t.date_limit > NOW()`,
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

const getUserLevelStats = async (req, res) => {
  try {
    const userId = req.user.sub;
    const LEVEL_BASE = 500;

    const [users] = await db.promise().query(
      'SELECT xp FROM User WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const xp = users[0].xp || 0;

    const level = Math.floor(xp / LEVEL_BASE);
    const remainder = xp % LEVEL_BASE;

    res.json({
      level,
      remainder,
      xp // total ref for debugging
    });

  } catch (error) {
    console.error('[getUserLevelStats] error:', error);
    res.status(500).json({ 
      error: 'Level calculation failed',
      details: error.message 
    });
  }
};

const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    
    await db.promise().query(
      'UPDATE User SET profile_pic = ? WHERE user_id = ?',
      [imageBuffer, req.user.sub]
    );

    fs.unlinkSync(req.file.path); // Clean up temp file
    
    res.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

// Get MY Profile Picture
const getMyProfilePic = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT profile_pic FROM User WHERE user_id = ?',
      [req.user.sub]
    );

    if (!rows[0]?.profile_pic) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    // Set proper content-type and send raw image data
    res.set('Content-Type', 'image/jpeg');
    res.send(rows[0].profile_pic);
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    res.status(500).json({ error: 'Failed to fetch profile picture' });
  }
};

//username change (self)
const changeUsername = async (req, res) => {
  try {
    const { newUsername } = req.body;
    const userId = req.user.sub; // From JWT

    // Validate input
    if (!newUsername || newUsername.trim().length < 3) {
      return res.status(400).json({ 
        success: false,
        error: 'Username must be at least 3 characters long'
      });
    }

    // Check if username already exists (case-insensitive)
    const [existingUser] = await db.promise().query(
      'SELECT user_id FROM User WHERE LOWER(username) = LOWER(?) AND user_id != ?',
      [newUsername, userId]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username already taken'
      });
    }

    // Update username
    await db.promise().query(
      'UPDATE User SET username = ? WHERE user_id = ?',
      [newUsername.trim(), userId]
    );

    res.json({
      success: true,
      message: 'Username updated successfully',
      newUsername
    });

  } catch (error) {
    console.error('changeUsername error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update username'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.sub; // From JWT

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Both current and new password are required'
      });
    }

    // Get user's current password hash from DB
    const [users] = await db.promise().query(
      'SELECT password FROM User WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in DB
    await db.promise().query(
      'UPDATE User SET password = ? WHERE user_id = ?',
      [newHash, userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update password'
    });
  }
};

const getUserLeaderboardPosition = async (req, res) => {
  try {
    const userId = req.user.sub; // Get from JWT
    
    // Using RANK() approach (MySQL 8.0+)
    const [results] = await db.promise().query(`
      SELECT user_rank
      FROM (
        SELECT 
          user_id,
          RANK() OVER (ORDER BY xp DESC, level DESC) AS user_rank
        FROM User
      ) AS ranked_users
      WHERE user_id = ?
    `, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      position: results[0].user_rank
    });
    
  } catch (error) {
    console.error("Error fetching leaderboard position:", error);
    res.status(500).json({ error: "Failed to get leaderboard position" });
  }
};

// Get Profile Picture by User ID
const getUserProfilePicById = async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await db.promise().query(
      'SELECT profile_pic FROM User WHERE user_id = ?',
      [userId]
    );

    if (!rows[0]?.profile_pic) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    // Set proper content-type and send raw image data
    res.set('Content-Type', 'image/jpeg');
    res.send(rows[0].profile_pic);
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    res.status(500).json({ error: 'Failed to fetch profile picture' });
  }
};

const deleteUserSelf = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.sub; // From JWT

    // Validate input
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Get user's current password hash from DB
    const [users] = await db.promise().query(
      'SELECT password FROM User WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, users[0].password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password'
      });
    }

    // Single query to delete user (cascades to related tables)
    await db.promise().query('DELETE FROM User WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('deleteUserSelf error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
};

module.exports = {
  getAllUsers,
  getHonorLeaderboard,
  checkUserEnrollments,
  updateUserByAdmin,
  updateUserRole,
  deleteUserByAdmin,
  getUserLevelStats,
  uploadProfilePic,
  getMyProfilePic,
  changeUsername,
  changePassword,
  getUserLeaderboardPosition,
  getUserProfilePicById,
  deleteUserSelf,
  upload
};
