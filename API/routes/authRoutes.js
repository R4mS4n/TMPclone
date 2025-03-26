const express = require('express');
const router=express.Router();
const {registerUser, loginUser, getUser, verifyToken}=require('../controllers/authController');

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/me", verifyToken,getUser);

module.exports=router;
