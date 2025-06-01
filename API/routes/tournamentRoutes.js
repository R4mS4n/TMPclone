const express = require("express");
const router = express.Router();
const { getAllTournaments,
        getCurrentTournaments,
        getTournamentById,
        participateInTournament, 
        checkEnrollment, 
        quitTournament,
        deleteTournament,
        updateTournament,
        getUserEnrolledChallengesCount,
        createTournament} = require("../controllers/tournamentController");
const {verifyToken, verifyAdmin, endpointAdminFilter} = require('../controllers/authController');

router.get("/", getAllTournaments);
router.get("/current", getCurrentTournaments);


router.get('/enrolled-count', verifyToken, getUserEnrolledChallengesCount);

router.get("/:id",getTournamentById);
router.get('/enrollment/:id', verifyToken, checkEnrollment);


router.post("/participateInTournament",verifyToken, participateInTournament);
router.post('/quitTournament',verifyToken, quitTournament);
router.delete('/:id', verifyToken, endpointAdminFilter, deleteTournament);
router.put('/:id', verifyToken, endpointAdminFilter, updateTournament);
router.post('/', verifyToken, endpointAdminFilter, createTournament);

module.exports = router;

