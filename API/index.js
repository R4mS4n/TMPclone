const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require("./routes/tournamentRoutes");
const userRoutes = require('./routes/userRoutes');
const db = require("./config/db");

const app = express();

// CORS setup to allow frontend access
app.use(cors({
  origin: "http://localhost:5173", // Update for production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json()); // Parses JSON requests

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/user", userRoutes);

// Start server
const PORT = process.env.APIPORT || 5000;
app.listen(PORT, () => console.log(`Server running in port ${PORT}`));
