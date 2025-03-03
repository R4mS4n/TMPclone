const db = require('../config/db'); //we import the DB conn
const bcrypt=require('bcryptjs'); //For PW hashing
const jwt=require('jsonwebtoken');
require('dotenv').config(); //for env variables

const registerUser=async(req,res)=>{
  try{
    let {username, mail, password}=req.body;
    
    username=username?.trim();
    mail=mail?.trim();
    password=password?.trim();
    //validate input
    if (!username || !mail || !password){
      return res.status (400).json({message: "All fields must be filled"});
    }
    if (!mail.endsWith("@techmahindra.com")){
      return res.status(400).json({message: "Invalid domain"})
    } 
    const [existingUser]=await db.promise().query(
      "SELECT * FROM User WHERE username = ? OR mail = ?",
      [username,mail]
    );

    //console.log("Existing User query result:", existingUser);

    if (existingUser.length>0){
      return res.status(400).json({message: "User already exists"});
    }
    
    const salt=await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(password,salt);
    
    const [result] = await db.promise().query(
      "INSERT INTO User (username, mail, password) VALUES (?, ?, ?)",
    [username, mail, hashedPassword]
    );

    //console.log("Insert Result:", result);

    const user_id = result.insertId;
    const token=jwt.sign({user_id, username}, process.env.JWT_SECRET, {expiresIn:"1h"});
    
    res.status(201).json({message: "User registered successfully!", token});
  } catch(error){
      res.status(500).json({message: "Server error, please try again later."});
    //forbidden shit for debugging
    //console.log(error)
      //  res.status(500).json({message: "Server error", error: error.message});

  }
};

const loginUser = async (req,res)=>{
  try{
    const {mail,password}=req.body;
    if(!mail||!password){
      return res.status(400).json({message: "All fields must be filled"});
    }
    
    const [userResult]=await db.promise().query(
      "SELECT * FROM User WHERE mail = ?",
      [mail]
    );
    if(userResult.length === 0){
      return res.status(401).json({message: "Invalid email"});
    }
    const isMatch=await bcrypt.compare(password,userResult[0].password);
    if(!isMatch){
      return res.status(401).json({message:"Invalid email or password"});
    }
    const token = jwt.sign(
      {user_id:userResult[0].user_id,username: userResult[0].username},
      process.env.JWT_SECRET,
      {expiresIn: "1h"}
    );

    res.json({message: "Login successful :3", token});
  } catch(error){
    console.error("Login error:",error);
    res.status(500).json({message: "Server error, please try again later"});
  }

};

module.exports = {registerUser,loginUser};
