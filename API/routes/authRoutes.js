// routes/authRoutes.js

const express = require('express');
const router  = express.Router();

const {
  registerUser,
  verifyEmail,
  loginUser,
  verifyToken,
  getUser,
  forgotPassword,
  resetPassword,
  verifyAdmin
} = require('../controllers/authController');

// ── Registro de usuario
// POST /api/auth/register
router.post('/register', registerUser);

// ── Verificación de email
// GET  /api/auth/verify-email?token=…
router.get('/verify-email', verifyEmail);

// ── Login de usuario
// POST /api/auth/login
router.post('/login', loginUser);

// ── Obtener datos del usuario autenticado
// GET  /api/auth/me  (requiere Authorization: Bearer <token>)
router.get('/me', verifyToken, getUser);

// ── Olvidé contraseña
// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// ── Resetear contraseña
// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// ── Verificar si es admin
// GET  /api/auth/verify-admin  (requiere Authorization: Bearer <token>)
router.get('/verify-admin', verifyToken, verifyAdmin);

module.exports = router;
