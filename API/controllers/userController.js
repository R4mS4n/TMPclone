const jwt = require('jsonwebtoken');
const db = require('../config/db');


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

module.exports = { getUser };

