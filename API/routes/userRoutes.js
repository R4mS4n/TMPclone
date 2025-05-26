const express = require('express');
const router = express.Router();

const {
  checkUserEnrollments,
  getAllUsers,
  getHonorLeaderboard,
  updateUserByAdmin,
  updateUserRole,
  deleteUserByAdmin,
  getUserLevelStats
} = require('../controllers/userController.js');

const { getUser } = require('../controllers/authController.js');
const { verifyToken } = require('../middleware/authMiddleware.js');

// Rutas protegidas
router.get('/level-stats', verifyToken, getUserLevelStats)
router.get('/me', verifyToken, getUser);
router.get('/enrollments', verifyToken, checkUserEnrollments);
router.get('/honor-leaderboard', getHonorLeaderboard);
router.get('/', verifyToken, getAllUsers); 

// Edición y eliminación
router.put('/:id', verifyToken, updateUserByAdmin);
router.delete('/:id', verifyToken, deleteUserByAdmin);

// Cambio de rol por superadmin
router.put('/:id/role', verifyToken, updateUserRole);

module.exports = router;
