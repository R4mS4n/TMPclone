// routes/adminRoutes.js

const express       = require('express');
const router        = express.Router();
const adminCtrl     = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Todas las rutas aquí requieren token válido y rol = 'admin'
router.use(verifyToken, requireAdmin);

router.get(   '/users',       adminCtrl.getAllUsers);
router.put(   '/users/:id',   adminCtrl.updateUser);
router.delete('/users/:id',   adminCtrl.deleteUser);

// Route to get content reports
router.get('/content-reports', adminCtrl.getAdminActionsReports);

// Route to process an admin action on a specific report (update status, issue penalty)
router.put('/content-reports/:reportId/action', adminCtrl.processReportAction);

// User Penalty Routes
// Issue a new penalty to a user
router.post('/users/:userId/penalties', adminCtrl.issueUserPenalty);

// Get all penalties for a specific user
router.get('/users/:userId/penalties', adminCtrl.getUserPenalties);

// Update the status of a specific penalty (e.g., lift a ban)
router.put('/penalties/:penaltyId/status', adminCtrl.updateUserPenaltyStatus);

// Report routes removed

module.exports = router;
