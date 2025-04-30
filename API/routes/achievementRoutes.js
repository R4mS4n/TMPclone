const express = require('express');
const router = express.Router();
const { getUserAchievements } = require('../controllers/achievementController');

router.get('/:user_id', getUserAchievements);

module.exports = router;
    