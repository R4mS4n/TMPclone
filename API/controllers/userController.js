const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getUser = async (req, res) => {
  try {
    const user_id = req.user.sub;

    // Get user info from the database
    const [user] = await db.promise().query('SELECT * FROM User WHERE user_id = ?', [user_id]);

    if (!user || user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user_id: user_id, username: user[0].username });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getAllUsers = async (req,res) => {
  try{
    const [users] = await db.promise().query(
      `SELECT * FROM User`
    );

    res.json({
    success: true,
    count: users.length,
    users
    });    
  } catch (error) {
    console.error("getAllUsers error: ", error);
    res.status(500).json({
      success:false,
      error: "Failed to fetch users"     
    });
  }

};

const getHonorLeaderboard = async (req, res) => {
  try {
    // Get users with the most honor points, limited to top 10
    const [leaderboard] = await db.promise().query(
      `SELECT 
        u.user_id,
        u.username,
        CONVERT(u.profile_pic USING utf8) as profile_pic,
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
    console.error("Honor leaderboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch honor leaderboard"
    });
  }
};

const checkUserEnrollments = async (req, res) => {
  try {
    // Get user_id from JWT (already verified by middleware)
    const userId = req.user.sub;

    // Query database for enrollments
    const [enrollments] = await db.promise().query(
      `SELECT 
        t.tournament_id as challenge_id,
        t.name as challenge_name,
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
    console.error("Enrollment check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch enrollments"
    });
  }
};

module.exports = { 
  getUser, 
  checkUserEnrollments,
  getAllUsers,
  getHonorLeaderboard
};

