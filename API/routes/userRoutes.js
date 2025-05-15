const express = require('express');
const router = express.Router();

const {
  getUser,
  checkUserEnrollments,
  getAllUsers,
  getHonorLeaderboard
} = require('../controllers/userController.js');
const { verifyToken, endpointAdminFilter } = require('../controllers/authController.js');

// Devuelve los datos del usuario autenticado
router.get('/me', verifyToken, getUser);

// Rutas ya existentes
router.get('/enrollments', verifyToken, checkUserEnrollments);
router.get('/honor-leaderboard', getHonorLeaderboard);
router.get('/users', verifyToken, endpointAdminFilter, getAllUsers);

module.exports = router;
