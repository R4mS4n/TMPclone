const express = require('express');
const router = express.Router();
const {top5Leaderboard, top10Leaderboard, top20Leaderboard} = require('../controllers/leaderboardController');

router.get('/5leaderboard', top5Leaderboard);
router.get('/10leaderboard', top10Leaderboard);
router.get('/20leaderboard', top20Leaderboard);

module.exports = router;