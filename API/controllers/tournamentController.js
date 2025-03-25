const db = require('../config/db');

const getAllTournaments = async (req, res) => {
  try {
    // Use db.promise().query() instead of db.execute()
    const [rows] = await db.promise().query("SELECT * FROM Tournament");

    console.log("Extracted Rows:", rows); // Log the actual data

    res.json(rows);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getAllTournaments };

