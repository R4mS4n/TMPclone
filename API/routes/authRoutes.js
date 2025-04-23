const express = require('express');
const router=express.Router();
const {registerUser, loginUser, getUser, verifyAdmin, verifyToken, verifyEmail, resetPassword, forgotPassword}=require('../controllers/authController');

router.get("/verify-email", verifyEmail);
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/me", verifyToken,getUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword)

router.get('/verify-admin', verifyToken, verifyAdmin);

module.exports=router;
