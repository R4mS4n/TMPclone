const db = require('../config/db'); //we import the DB conn
const bcrypt=require('bcryptjs'); //For PW hashing
const jwt=require('jsonwebtoken');
require('dotenv').config(); //for env variables
const crypto=require('crypto');
const nodemailer =require('nodemailer');

//console.log(process.env.BOT_EMAIL);
const transporter=nodemailer.createTransport({
  service: 'gmail',
  auth:{
    user:process.env.BOT_EMAIL,
    pass: process.env.BOT_PASSKEY
  }

});
//Register user
const registerUser=async(req,res)=>{
  try{
    let {username, mail, password}=req.body;
    //validate input
    if (!username || !mail || !password){
      return res.status (400).json({message: "All fields must be filled"});
    }
    /*
    //este pedo es para filtrar los domains, pero ps como no tenemos acceso al @techmahindra.com pues lo ignoramos for now

    if (!mail.endsWith("@techmahindra.com")){
      return res.status(400).json({message: "Invalid domain"})
    }
    */
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
    // verification goken generation
    const verificationToken=crypto.randomBytes(32).toString('hex');
    const tokenExpires=new Date(Date.now()+24*60*60*1000);// expira en 24h

    //creamos el usuario pero en estado no verificado
    await db.promise().query(
    `INSERT INTO User
    (username, mail, password, verification_token, token_expires_at, is_verified)
    VALUE (?, ?, ?, ?, ?, FALSE)`,
    [username, mail, hashedPassword, verificationToken, tokenExpires]
    );
    
    //creamos y mandamos el link de verificacion via mail

    const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${verificationToken}`;
    console.log(verificationLink);
      await transporter.sendMail({
        from: `"TMP App" <${process.env.BOT_EMAIL}>`,
        to: mail,
        subject: 'Verify Your Email',
        html: `
          <h2>Welcome to TMP!</h2>
          <p>Click below to verify your email:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>Link expires in 24 hours.</p>
        `
    });

      res.status(201).json({ 
        message: "Registration successful! Please check your email to verify your account."
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        message: "Server error", 
        error: error.message 
      });
    }
  };

  //endpoint para verificar el mail
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // 1. Verify token and mark user as verified
    const [user] = await db.promise().query(
      `UPDATE User 
       SET is_verified = TRUE,
           verification_token = NULL,
           token_expires_at = NULL
       WHERE verification_token = ?
       AND token_expires_at > NOW()
       AND is_verified = FALSE
       LIMIT 1`,
      [token]
    );

    if (user.affectedRows === 0) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #ff4444; font-size: 24px; }
            .button { 
              background: #4CAF50; color: white; padding: 10px 20px; 
              text-decoration: none; border-radius: 5px; margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="error">Verification Failed</div>
          <p>This link is invalid or expired.</p>
          <a href="${process.env.FRONTEND_URL}/register" class="button">Try Registering Again</a>
        </body>
        </html>
      `);
    }

    // 3. Show success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f5f5f5;
          }
          .success { 
            color: #4CAF50; 
            font-size: 28px; 
            margin-bottom: 20px;
          }
          .button {
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
            margin-top: 20px;
          }
          .container {
            background: white;
            max-width: 500px;
            margin: 0 auto;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓ Email Verified Successfully!</div>
          <p>You can now log in to your account.</p>
          <a href="${process.env.FRONTEND_URL}/login" class="button">Go to Login</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).send(`
      <h1>Server Error</h1>
      <p>Please try again later.</p>
    `);
  }
};

    /*
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
*/
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
        role,
        is_verified
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

    if(!user.is_verified){
      return res.status(403).json({
        error: "Email not verified",
        code: "UNVERIFIED EMAIL"
      });

    }
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
    console.log("Decoded token:", decoded);
    
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


module.exports = {registerUser,loginUser, getUser, verifyToken, verifyEmail};
