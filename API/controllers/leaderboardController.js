const db = require('../config/db');

// GET /leaderboard
const top5Leaderboard = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        RANK() OVER (ORDER BY xp DESC) AS position,
        level,
        username,
        xp
      FROM User
      ORDER BY xp DESC
      LIMIT 5
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const top10Leaderboard = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        RANK() OVER (ORDER BY xp DESC) AS position,
        user_id,
        level,
        username,
        xp
      FROM User
      ORDER BY xp DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const top20Leaderboard = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        RANK() OVER (ORDER BY xp DESC) AS position,
        level,
        username,
        xp
      FROM User
      ORDER BY xp DESC
      LIMIT 20
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  top5Leaderboard, top10Leaderboard, top20Leaderboard
};