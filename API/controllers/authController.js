const db = require('../config/db'); //we import the DB conn
const bcrypt=require('bcryptjs'); //For PW hashing
const jwt=require('jsonwebtoken');
require('dotenv').config(); //for env variables

const registerUser=async(req,res)=>{
  try{
    const {username, mail, password}=req.body;

    //validate input
    if (!username || !mail || !password){
      return res.status (400).json({message: "All fields must be filled"});
    }
    
    const [existingUser]=await db.promise().query(
      "SELECT * FROM User WHERE username = ? OR mail = ?",
      [username,mail]
    );

    console.log("Existing User query result:", existingUser);

    if (existingUser.length>0){
      return res.status(400).json({message: "User already exists"});
    }
    
    const salt=await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(password,salt);
    
    const [result] = await db.promise().query(
      "INSERT INTO User (username, mail, password) VALUES (?, ?, ?)",
    [username, mail, hashedPassword]
    );

    console.log("Insert Result:", result);

    const user_id = result.insertId;
    const token=jwt.sign({user_id, username}, process.env.JWT_SECRET, {expiresIn:"1h"});
    
    res.status(201).json({message: "User registered successfully!", token});


  } catch(error){
      //res.status(500).json({message: "Server error, please try again later."});
    //forbidden shit for debugging
        res.status(500).json({message: "Server error", error: error.message});

  }

};

module.exports = {registerUser};
