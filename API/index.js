const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const userRoutes = require('./routes/userRoutes');
const questionRoutes = require('./routes/questionRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const devRoutes = require('./routes/devRoutes'); // Ruta temporal para test

const app = express();

// Configuración CORS
app.use(cors({
  origin: "http://localhost:5173", // Cambiar esto en deployment
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json()); // Body parser JSON

// Rutas de la API
app.use("/api/auth", authRoutes); // puede cambiarse
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/dev", devRoutes); // Solo para pruebas temporales

// Puerto
const PORT = process.env.APIPORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});
