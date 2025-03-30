const db = require('../config/db'); //we import the DB conn
const bcrypt=require('bcryptjs'); //For PW hashing
const jwt=require('jsonwebtoken');
require('dotenv').config(); //for env variables

//Register user
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
    
    const [result]=await db.promise().query(
      "INSERT INTO User (username, mail, password) VALUES (?, ?, ?)",
    [username, mail, hashedPassword]
    );
    
    res.status(201).json({message: "User registered successfully! pls login"});


    
  } catch(error){
      //res.status(500).json({message: "Server error, please try again later."});
    //forbidden shit for debugging
    console.log(error)
    console.error("Registration error: ", error);
    res.status(500).json({message: "Serveer error", error: error.message});

  }
};

//Login user
const loginUser = async (req,res)=>{
  try{
    const {mail,password}=req.body;

    if(!mail||!password){
      return res.status(400).json({message: "All fields must be filled"});
    }
    
    const [userResult] = await db.promise().query(
      `SELECT 
        user_id, 
        username, 
        password,
        role
      FROM User 
      WHERE mail = ?`,
      [mail]
    );

    if (userResult.length === 0) {
      return res.status(401).json({ 
        error: "Invalid credentials",  // Generic message for security
        code: "INVALID_CREDENTIALS"
      });
    }
    const user = userResult[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }
    console.log("login, uid: ", user.user_id)
    const token = jwt.sign(
      {
        sub: user.user_id,          // Standard JWT claim for subject
        username: user.username,
        iss: "TMP",       // Issuer
        aud: "client_app",          // Audience
        role: "user",               // Future-proof for roles
        fresh: true                 // Distinguishes login from token refresh
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: "1h",
        algorithm: "HS256"          // Explicit algorithm
      }
    );

    res.json({message: "Login successful :3", token});
  } catch(error){
    console.error("Login error:",error);
    res.status(500).json({message: "Server error, please try again later", error: error.message});
    }
};

const verifyToken = (req, res, next) => {
  // Get token from Authorization header instead of cookies
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    
    // Make sure decoded contains the expected data
    console.log("Decoded token:", decoded); // Debug log
    
    // Attach ALL necessary user data to req.user
    req.user = {
      sub: decoded.sub,          // user_id
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  });
};

// Get Authenticated User Details
const getUser = (req, res) => {
  res.json({ user_id: req.user_id });
};


module.exports = {registerUser,loginUser, getUser, verifyToken};
