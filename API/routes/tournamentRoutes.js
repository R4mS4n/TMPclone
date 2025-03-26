const express = require("express");
const router = express.Router();
const { getAllTournaments,getTournamentById,participateInTournament, checkEnrollment, quitTournament} = require("../controllers/tournamentController");

router.get("/", getAllTournaments);

router.get("/:id",getTournamentById);

router.post("/participate", participateInTournament);

router.get('/enrollment/:id', checkEnrollment);

router.post('/quitTournament',quitTournament)
module.exports = router;

