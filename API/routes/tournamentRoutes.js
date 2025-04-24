const express = require("express");
const router = express.Router();
const { getAllTournaments,
        getTournamentById,
        participateInTournament, 
        checkEnrollment, 
        quitTournament,
        deleteTournament,
        updateTournament,
        createTournament} = require("../controllers/tournamentController");
const {verifyToken, verifyAdmin, endpointAdminFilter} = require('../controllers/authController');

router.get("/", getAllTournaments);

router.get("/:id",getTournamentById);

router.post("/participateInTournament",verifyToken, participateInTournament);

router.get('/enrollment/:id', verifyToken, checkEnrollment);

router.post('/quitTournament',verifyToken, quitTournament);

router.delete('/:id', verifyToken, endpointAdminFilter, deleteTournament);

router.put('/:id', verifyToken, endpointAdminFilter, updateTournament);

router.post('/', verifyToken, endpointAdminFilter, createTournament);

module.exports = router;

