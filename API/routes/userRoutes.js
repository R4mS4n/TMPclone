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
  changePassword,
  getUserLeaderboardPosition,
  getUserProfilePicById,
  deleteUserSelf,
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

router.get('/leaderboard-position', verifyToken, getUserLeaderboardPosition);

router.put('/change-username', verifyToken, (req, res, next) => {
  changeUsername(req, res).catch(next);
});

router.put('/change-password', verifyToken, changePassword);

// Profile picture routes
router.get('/profile-pic', verifyToken, getMyProfilePic);

router.get('/profile-pic/:id', verifyToken, getUserProfilePicById);
router.post(
  '/upload-profile-pic',
  verifyToken,
  upload.single('profilePic'),
  uploadProfilePic
);
router.delete('/delete-account', verifyToken, deleteUserSelf);


// Edición y eliminación
router.put('/:id', verifyToken, updateUserByAdmin);
router.delete('/:id', verifyToken, deleteUserByAdmin);

// Cambio de rol por superadmin
router.put('/:id/role', verifyToken, updateUserRole);



module.exports = router;
