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
const participateInTournament=async (req,res)=>{
  const {user_id,tournament_id}=req.body;
  //console.log(`User ID: ${user_id}, Tournament ID: ${tournament_id}`);

  //excluimos excepciones basicas para no ensuciar la DB
  if(!user_id || !tournament_id){
    return res.status(400).json({error: 'Missing arguments'});
  }
  //una vez validamos que tenemos los argumentos, intentamos hacer el query
  try{
    await db.promise().query(
      "INSERT INTO Tournament_Participation (user_id,tournament_id, score) VALUES (?,?,0);", [user_id, tournament_id]//iniciamos la participacion con valor 0
    );
    //Esto significa que al dropperar un challenge/torneo y volver a inscribir, tu score se va a reiniciar
    res.status(200).json({message:"Enrollement successful :D"})
  } catch (error){
    console.error("Error enrolling in tournament :(", error);
    res.status(500).json({error: "Internal server error"});

  }

};

const quitTournament = async (req,res) => {
  const {user_id,tournament_id} = req.body;
  
    if(!user_id || !tournament_id){
      return res.status(400).json({error: 'Missing args'});
    }
    try{
      await db.promise().query("DELETE FROM Tournament_Participation WHERE user_id = ? AND tournament_id = ?;", [user_id, tournament_id]);
    res.status(200).json({message:"Quit challenge successfully"})
    } catch (error){
      console.error("Error quitting tournament", error);
      res.status(500).json({error: "Internal server error"})
    } 
};


const checkEnrollment = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user_id;

  if (!user_id) {
    console.error("Missing user_id in checkEnrollment");
    return res.status(400).json({ error: "Missing user_id" });
  }

  try {
    console.log(`Checking enrollment for user ${user_id} in tournament ${id}`);

    const [result] = await db.promise().query(
      "SELECT * FROM Tournament_Participation WHERE user_id = ? AND tournament_id = ?",
      [user_id, id]
    );

    if (result.length > 0) {
      console.log("User is enrolled: true");
      return res.json({ enrolled: true });
    }

    console.log("User is enrolled: false");
    return res.json({ enrolled: false });

  } catch (error) {
    console.error("Error checking enrollment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllTournaments,
  getTournamentById,
  participateInTournament,
  checkEnrollment,
  quitTournament
};

