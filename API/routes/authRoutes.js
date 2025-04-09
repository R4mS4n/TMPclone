const express = require('express');
const router=express.Router();
const {registerUser, loginUser, getUser, verifyToken, verifyEmail}=require('../controllers/authController');

router.get("/verify-email", verifyEmail);
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/me", verifyToken,getUser);

module.exports=router;
