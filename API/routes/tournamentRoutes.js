const express = require("express");
const router = express.Router();
const { getAllTournaments,getTournamentById} = require("../controllers/tournamentController");

router.get("/", getAllTournaments);

router.get("/:id",getTournamentById);

module.exports = router;

