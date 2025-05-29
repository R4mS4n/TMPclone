const express = require('express');
const router = express.Router();
const { submitReport } = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware'); // Assuming you have auth middleware

// POST /api/reports - Submit a new report
router.post('/', verifyToken, submitReport);

module.exports = router; 