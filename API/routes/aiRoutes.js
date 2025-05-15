const express = require('express');
const router = express.Router();
const {analyzeCode} = require('../controllers/aiController');

router.post("/analyzeCode", analyzeCode);

module.exports = router;