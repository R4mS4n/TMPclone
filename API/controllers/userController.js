const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getUser = async (req, res) => {
  try {
    const user_id = req.user.sub;

    // Obtenemos los datos del usuario
    const [rows] = await db
      .promise()
      .query('SELECT user_id, username FROM User WHERE user_id = ?', [user_id]);

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Devolvemos sólo lo necesario
    return res.json({
      user_id: rows[0].user_id,
      username: rows[0].username
    });

  } catch (err) {
    console.error('getUser error:', err);
    return res.status(500).json({ error: err.message });
  }
};

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

module.exports = {
  getUser,
  getAllUsers,
  getHonorLeaderboard,
  checkUserEnrollments
};
