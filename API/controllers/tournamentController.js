const db = require('../config/db');

// Obtener todos los torneos
const getAllTournaments = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM Tournament");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Obtener un torneo específico por ID
const getTournamentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.promise().query("SELECT * FROM Tournament WHERE tournament_id = ?", [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.json(results[0]); // Send the specific tournament object
  } catch (error) {
    console.error("Error fetching tournament:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllTournaments,
  getTournamentById
};

