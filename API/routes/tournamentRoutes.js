const express = require("express");
const router = express.Router();
const { getAllTournaments,
        getTournamentById,
        participateInTournament, 
        checkEnrollment, 
        quitTournament} = require("../controllers/tournamentController");
const {verifyToken} = require('../controllers/authController')

router.get("/", getAllTournaments);

router.get("/:id",getTournamentById);

router.post("/participateInTournament",verifyToken, participateInTournament);

router.get('/enrollment/:id', verifyToken, checkEnrollment);

router.post('/quitTournament',verifyToken, quitTournament)
module.exports = router;

