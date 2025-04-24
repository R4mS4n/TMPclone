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

//This should check the enrollment for a specific challenge
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



/*
 Esta funcion es para desplegar todos los challenges inscritos asociados a un ID, pero la verdad creo que podemos optimizarlo si cambiamos un poco el checkEnrollment, no se
 */

/*la funcion deleteTournament borra un torneo en especifico, tiene que poder borrar el torneo y las inscripciones asociadas al torneos

por esto mismo, tenemos que:
1. Borrar las participaciones asociadas al ID del torneo
2. Finalmente, borrar el torneo

Esto tiene que ser tratado como una transaccion, porque si algo sale mal en el primer paso, se nos jode la integridad de los datos, por eso necesitamos atomicidad
  */
//ESTE ENDPOINT PUEDE FALLAR SI LE MOVEMOS A LAS FKS RELACIONADAS A LA TABLA Tournament
const deleteTournament = async (req,res) => {
  const tournamentId = req.params.id;

  try{
    const [result] = await db.promise().query(
      'DELETE FROM Tournament WHERE tournament_id = ?',
      [tournamentId]
    );

    if(result.affectedRows === 0) {
      return res.status(404).json({error: "Tournament not found"});
    }

    res.json({
      success: true,
      message: "Tournament and all related data deleted successfully"
    });
  } catch (error){
    console.error("Delete error: ", error);
    res.status(500).json({
      success: false,
      error: "Delete failed",
      details: error.sqlMessage || error.message
    });
  }
}

module.exports = {
  getAllTournaments,
  getTournamentById,
  participateInTournament,
  checkEnrollment,
  quitTournament,
  deleteTournament
};

