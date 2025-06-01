const db = require('../config/db');
const { checkAchievements } = require('./achievementController'); // 👈 Importación clave

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

const getCurrentTournaments = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM Tournament WHERE date_limit >= NOW()");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Obtener un torneo especifico por ID
const getTournamentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.promise().query("SELECT * FROM Tournament WHERE tournament_id = ?", [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.json(results[0]);
  } catch (error) {
    console.error("Error fetching tournament:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Inscribir usuario a torneo
const participateInTournament = async (req, res) => {
  try {
    const userId = req.user.sub;
    const tournamentId = req.body.tournament_id;

    await db.promise().query(
      `INSERT INTO Tournament_Participation 
       (user_id, tournament_id, score) 
       VALUES (?, ?, 0)`,
      [userId, tournamentId]
    );

    // ✅ Verificar logros automáticamente
    await checkAchievements(userId);

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Already enrolled" });
    } else {
      console.error("Error during tournament enrollment:", error);
      res.status(500).json({ error: "Enrollment failed" });
    }
  }
};

// Cancelar inscripción a torneo
const quitTournament = async (req, res) => {
  try {
    await db.promise().query(
      `DELETE FROM Tournament_Participation 
       WHERE user_id = ? AND tournament_id = ?`,
      [req.user.sub, req.body.tournament_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to quit tournament" });
  }
};

// Verificar si está inscrito en torneo
const checkEnrollment = async (req, res) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ error: "User not authed" });
    }
    const [enrollment] = await db.promise().query(
      `SELECT * FROM Tournament_Participation
       WHERE user_id = ? AND tournament_id = ?`,
      [req.user.sub, req.params.id]
    );

    res.json({ enrolled: enrollment.length > 0 });
  } catch (error) {
    console.error("Enrollment check error: ", error);
    res.status(500).json({ error: "Failed to check enrollment" });
  }
};

// Eliminar torneo y participaciones asociadas
const deleteTournament = async (req, res) => {
  const tournamentId = req.params.id;

  try {
    const [result] = await db.promise().query(
      'DELETE FROM Tournament WHERE tournament_id = ?',
      [tournamentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json({
      success: true,
      message: "Tournament and all related data deleted successfully"
    });
  } catch (error) {
    console.error("Delete error: ", error);
    res.status(500).json({
      success: false,
      error: "Delete failed",
      details: error.sqlMessage || error.message
    });
  }
};

// Editar torneo
const updateTournament = async (req, res) => {
  const { id } = req.params;
  const { name, description, date_limit } = req.body;

  if (!name || date_limit === undefined) {
    return res.status(400).json({
      error: "Name and date limit are required"
    });
  }

  try {
    const [result] = await db.promise().query(
      `UPDATE Tournament 
       SET name = ?, description = ?, date_limit = ?
       WHERE tournament_id = ?`,
      [name, description, date_limit, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json({
      success: true,
      message: "Tournament updated successfully",
      tournament: { id, name, description, date_limit }
    });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: "Update failed",
      details: error.sqlMessage || error.message
    });
  }
};

// Crear torneo
const createTournament = async (req, res) => {
  const { name, description, date_limit } = req.body;

  if (!name || date_limit === undefined) {
    return res.status(400).json({
      error: "Name and date limit are required",
      received: req.body
    });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO Tournament (name, description, date_limit)
       VALUES (?, ?, ?)`,
      [name, description, date_limit]
    );

    const [newTournament] = await db.promise().query(
      'SELECT * FROM Tournament WHERE tournament_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      tournament: newTournament[0]
    });

  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({
      error: "Create failed",
      details: error.sqlMessage || error.message
    });
  }
};

const getUserEnrolledChallengesCount = async (req, res) => {
  try {
    const userId = req.user.sub; // Get user ID from JWT
    
    const [results] = await db.promise().query(
      `SELECT COUNT(*) AS challenge_count 
       FROM Tournament_Participation 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      count: results[0].challenge_count
    });
    
  } catch (error) {
    console.error("Error fetching enrolled challenges count:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to get challenge count" 
    });
  }
};

module.exports = {
  getAllTournaments,
  getCurrentTournaments,
  getTournamentById,
  participateInTournament,
  checkEnrollment,
  quitTournament,
  deleteTournament,
  updateTournament,
  createTournament,
  getUserEnrolledChallengesCount
};
