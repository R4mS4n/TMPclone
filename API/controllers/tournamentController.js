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

// Obtener un torneo especifico por ID
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

// esta funcion nos ayudara a poder inscribir usuarios a los torneos
const participateInTournament = async (req, res) => {
  try {
    await db.promise().query(
      `INSERT INTO Tournament_Participation 
       (user_id, tournament_id, score) 
       VALUES (?, ?, 0)`, // Default score 0
      [req.user.sub, req.body.tournament_id] // sub from JWT
    );
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Already enrolled" });
    } else {
      res.status(500).json({ error: "Enrollment failed" });
    }
  }
};

const quitTournament = async (req, res) => {
  try {
    await db.promise().query(
      `DELETE FROM Tournament_Participation 
       WHERE user_id = ? AND tournament_id = ?`,
      [req.user.sub, req.body.tournament_id] // sub from JWT
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to quit tournament" });
  }
};


const checkEnrollment = async (req, res) => {
  try{
    console.log("Req user", req.user);
    if(!req.user?.sub){
      return res.status(401).json({error: "User not authed"});
    }
    const [enrollment] = await db.promise().query(
      `SELECT * FROM Tournament_Participation
      WHERE user_id = ? AND tournament_id = ?`,
      [req.user.sub, req.params.id] //we get this from jwt
    );
  
  res.json({enrolled: enrollment.length>0});
  } catch (error){
    console.error("Enrollment check error: ", error);
    res.status(500).json({error: "Failed to check enrollment"});
  }
};

module.exports = {
  getAllTournaments,
  getTournamentById,
  participateInTournament,
  checkEnrollment,
  quitTournament
};

