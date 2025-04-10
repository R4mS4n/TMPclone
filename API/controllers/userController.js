const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];  // Assuming bearer token is in the "Authorization" header
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.user_id;

    // You can then get user info from the database if needed
    const [user] = await db.promise().query('SELECT * FROM User WHERE user_id = ?', [user_id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user_id: user_id, username: user[0].username });

  } catch (err) {
    return res.status(500).json({ error: err.message });
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
  checkUserEnrollments
};

