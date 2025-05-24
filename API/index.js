require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const db      = require('./config/db');

// Importar rutas
const authRoutes        = require('./routes/authRoutes');
const tournamentRoutes  = require('./routes/tournamentRoutes');
const userRoutes        = require('./routes/userRoutes');
const questionRoutes    = require('./routes/questionRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const devRoutes         = require('./routes/devRoutes');
const postRoutes        = require('./routes/postRoutes');
const adminRoutes       = require('./routes/adminRoutes');       // Panel de Admin
const aiRoutes          = require('./routes/aiRoutes');          // Rutas de IA
const leaderboardRoutes = require('./routes/leaderboardRoutes'); // Rutas de Leaderboard

const app = express();

// Configuración CORS
app.use(cors({
  origin:      "http://localhost:5173",
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Rutas de la API
app.use("/api/auth",         authRoutes);
app.use("/api/tournaments",  tournamentRoutes);
app.use("/api/users",        userRoutes); 
app.use("/api/questions",    questionRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/dev",          devRoutes);
app.use("/api/posts",        postRoutes);
app.use("/api/admin",        adminRoutes);
app.use("/api/ai",           aiRoutes);
app.use("/api/leaderboard",  leaderboardRoutes);

const PORT = process.env.APIPORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
