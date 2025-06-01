const express = require('express');
const router = express.Router();

const {
  checkUserEnrollments,
  getAllUsers,
  getHonorLeaderboard,
  updateUserByAdmin,
  updateUserRole,
  deleteUserByAdmin,
  getUserLevelStats,
  uploadProfilePic,
  getMyProfilePic,
  changeUsername,
  upload
} = require('../controllers/userController.js');

const { getUser } = require('../controllers/authController.js');
const { verifyToken } = require('../middleware/authMiddleware.js');

// Rutas protegidas
router.get('/level-stats', verifyToken, getUserLevelStats)
router.get('/me', verifyToken, getUser);
router.get('/enrollments', verifyToken, checkUserEnrollments);
router.get('/honor-leaderboard', getHonorLeaderboard);
router.get('/', verifyToken, getAllUsers);

router.put('/change-username', verifyToken, (req, res, next) => {
  changeUsername(req, res).catch(next);
});

// Profile picture routes
router.get('/profile-pic', verifyToken, getMyProfilePic);
router.post(
  '/upload-profile-pic',
  verifyToken,
  upload.single('profilePic'),
  uploadProfilePic
);

// Edición y eliminación
router.put('/:id', verifyToken, updateUserByAdmin);
router.delete('/:id', verifyToken, deleteUserByAdmin);

// Cambio de rol por superadmin
router.put('/:id/role', verifyToken, updateUserRole);



module.exports = router;
