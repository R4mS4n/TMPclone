const express = require('express');
const router = express.Router();

const {
  checkUserEnrollments,
  getAllUsers,
  getHonorLeaderboard,
  updateUserByAdmin,
  deleteUserByAdmin
} = require('../controllers/userController.js');

const { getUser } = require('../controllers/authController.js');
const { verifyToken } = require('../middleware/authMiddleware.js');

router.get('/me', verifyToken, getUser);
router.get('/enrollments', verifyToken, checkUserEnrollments);
router.get('/honor-leaderboard', getHonorLeaderboard);
router.get('/users', verifyToken, getAllUsers);
router.put('/users/:id', verifyToken, updateUserByAdmin);
router.delete('/users/:id', verifyToken, deleteUserByAdmin);

module.exports = router;
