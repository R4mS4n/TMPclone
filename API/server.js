const express=require('express');
const cors =require('cors');
const authRoutes=require('./routes/authRoutes');
const tournamentRoutes=require("./routes/tournamentRoutes");
const userRoutes=require('./routes/userRoutes');
const db=require("./config/db");

const app=express();
//setteamos el cors para que solo se pueda comunicar con el frontend
app.use(cors({
  origin: "http://localhost:5173", //cambiaremos esto upon deployment
  credentials: true
}));

app.use(express.json()); //to parse json req
app.use("/api/auth", authRoutes); //might change this
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/user", userRoutes);

const PORT=process.env.APIPORT||5000;
app.listen(PORT, ()=> console.log(`Server running in port ${PORT}`));
