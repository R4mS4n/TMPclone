const express = require('express');
const router = express.Router();
const {verifyToken, endpointAdminFilter} = require('../controllers/authController.js');
const {checkUserEnrollments, getAllUsers, getHonorLeaderboard} = require('../controllers/userController.js');

router.get('/enrollments', verifyToken, checkUserEnrollments);
router.get('/honor-leaderboard', getHonorLeaderboard);
router.get('/users', verifyToken, endpointAdminFilter, getAllUsers);

module.exports = router;

