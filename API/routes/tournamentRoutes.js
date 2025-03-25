const express = require("express");
const router = express.Router();
const { getAllTournaments } = require("../controllers/tournamentController");

router.get("/", getAllTournaments);

module.exports = router;

