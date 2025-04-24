const express = require("express");
const router = express.Router();
const { getAllTournaments,
        getTournamentById,
        participateInTournament, 
        checkEnrollment, 
        quitTournament,
        deleteTournament} = require("../controllers/tournamentController");
const {verifyToken, verifyAdmin} = require('../controllers/authController');

router.get("/", getAllTournaments);

router.get("/:id",getTournamentById);

router.post("/participateInTournament",verifyToken, participateInTournament);

router.get('/enrollment/:id', verifyToken, checkEnrollment);

router.post('/quitTournament',verifyToken, quitTournament);

router.delete('/:id', verifyToken, verifyAdmin, deleteTournament);

module.exports = router;

