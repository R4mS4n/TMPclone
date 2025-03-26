const express = require("express");
const router = express.Router();
const { getAllTournaments,getTournamentById,participateInTournament} = require("../controllers/tournamentController");

router.get("/", getAllTournaments);

router.get("/:id",getTournamentById);

router.post("/participate", participateInTournament);

module.exports = router;

