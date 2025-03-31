const express = require('express');
const {getUser} = require('../controllers/userController');  // Import userController
const router = express.Router();
const {verifyToken} = require('../controllers/authController.js');
const {checkUserEnrollments} = require('../controllers/userController.js');

router.get('/me', getUser); //might actually be useless, use for debugging, will prollybe deleted for prod

router.get('/enrollments', verifyToken, checkUserEnrollments);
module.exports = router;

