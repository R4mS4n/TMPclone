const jwt = require('jsonwebtoken');

const verifyToken=(req,res,next)=> {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if(!token){
    return res.status(401).json({error: "No token, auth denied"});
  }
  
  try{
    const decoded=jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user_id=decoded.user_id;
    next();
  }catch (err){
    console.error("Error verifying token:", err);
    return res.status(403).json({error: "Token is not valid"});;
  }
};

module.exports = {verifyToken};
