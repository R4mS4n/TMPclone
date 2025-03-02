const express=require('express');
const cors =require('cors');
const authRoutes=require('./routes/authRoutes');

const app=express();
app.use(cors());
app.use(express.json()); //to parse json req
app.use("/api/auth", authRoutes); //might change this

const PORT=process.env.APIPORT||5000;
app.listen(PORT, ()=> console.log(`Server running in port ${PORT}`));
