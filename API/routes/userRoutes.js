const express = require('express');
const router = express.Router();
const {verifyToken, endpointAdminFilter} = require('../controllers/authController.js');
const {checkUserEnrollments, getAllUsers} = require('../controllers/userController.js');

router.get('/enrollments', verifyToken, checkUserEnrollments);

router.get('/users', verifyToken, endpointAdminFilter, getAllUsers);
module.exports = router;

