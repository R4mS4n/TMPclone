// controllers/authController.js

require('dotenv').config();
const db         = require('../config/db');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const nodemailer = require('nodemailer');

// Configuración de transporte para nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.BOT_EMAIL,
    pass: process.env.BOT_PASSKEY
  }
});

/**
 * Registro de usuario
 */
const registerUser = async (req, res) => {
  try {
    const { username, mail, password } = req.body;
    if (!username || !mail || !password) {
      return res.status(400).json({ message: "All fields must be filled" });
    }

    const [existing] = await db.promise().query(
      "SELECT * FROM `User` WHERE username = ? OR mail = ?",
      [username, mail]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt            = await bcrypt.genSalt(10);
    const hashedPassword  = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires      = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.promise().query(
      `INSERT INTO \`User\`
         (username, mail, password, verification_token, token_expires_at, is_verified)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [username, mail, hashedPassword, verificationToken, tokenExpires]
    );

    const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${verificationToken}`;
    console.log('[REGISTER] Verification link:', verificationLink);

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

    res.status(201).json({ message: "Registration successful! Please check your email." });
  } catch (error) {
    console.error('[REGISTER] error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Verificación de email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const [result] = await db.promise().query(
      `UPDATE \`User\`
         SET is_verified = TRUE,
             verification_token = NULL,
             token_expires_at = NULL
       WHERE verification_token = ?
         AND token_expires_at > NOW()
         AND is_verified = FALSE
       LIMIT 1`,
      [token]
    );

    if (result.affectedRows === 0) {
      return res.status(400).send(`
        <h2 style="color:#f44;">Verification Failed</h2>
        <p>Link is invalid or expired.</p>
        <a href="${process.env.FRONTEND_URL}/register">Try Registering Again</a>
      `);
    }

    return res.send(`
      <h2 style="color:#4CAF50;">✓ Email Verified Successfully!</h2>
      <p>You can now log in.</p>
      <a href="${process.env.FRONTEND_URL}/login">Go to Login</a>
    `);
  } catch (error) {
    console.error('[VERIFY EMAIL] error:', error);
    res.status(500).send('<h1>Server Error</h1><p>Please try again later.</p>');
  }
};

/**
 * Inicio de sesión (login) — con logs de depuración
 */
const loginUser = async (req, res) => {
  try {
    const { mail, password } = req.body;

    console.log('[LOGIN] mail recibido:', mail);
    console.log('[LOGIN] password raw:', password);
    console.log('[LOGIN] password.length:', password?.length);

    const [rows] = await db.promise().query(
      `SELECT user_id, username, password, role, is_verified
         FROM \`User\`
        WHERE mail = ?`,
      [mail]
    );
    if (rows.length === 0) {
      console.log('[LOGIN] ❌ Usuario no encontrado');
      return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    }

    const user = rows[0];
    console.log('[LOGIN] Datos de BD:', {
      user_id:     user.user_id,
      username:    user.username,
      role:        user.role,
      is_verified: user.is_verified
    });
    console.log('[LOGIN] hash en BD:', user.password);
    console.log('[LOGIN] hash.length:', user.password.length);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] bcrypt.compare →', isMatch);

    if (!user.is_verified) {
      console.log('[LOGIN] ❌ Email no verificado');
      return res.status(403).json({ error: "Email not verified", code: "UNVERIFIED_EMAIL" });
    }
    if (!isMatch) {
      console.log('[LOGIN] ❌ Contraseña inválida según bcrypt');
      return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    }

    // Generar JWT
    const token = jwt.sign(
      { sub: user.user_id, username: user.username, role: user.role, fresh: true },
      process.env.JWT_SECRET,
      { expiresIn: "1h", algorithm: "HS256" }
    );
    console.log('[LOGIN] ✅ Login exitoso');
    return res.json({ message: "Login successful :3", token });
  } catch (err) {
    console.error('[LOGIN] ERROR:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Middleware para validar JWT
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = {
      sub:      decoded.sub,
      username: decoded.username,
      role:     decoded.role
    };
    next();
  });
};

/**
 * Obtener datos del usuario autenticado
 */
const getUser = (req, res) => {
  res.json({ user_id: req.user.sub });
};

/**
 * Olvidé contraseña: envío de token
 */
const forgotPassword = async (req, res) => {
  console.log('[ForgotPassword] Request:', req.body);
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required', code: 'MISSING_EMAIL' });
    }

    const [users] = await db.promise().query(
      `SELECT user_id FROM \`User\` WHERE mail = ? LIMIT 1`,
      [email]
    );
    if (users.length > 0) {
      const resetToken   = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 3600000);
      await db.promise().query(
        `UPDATE \`User\` SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?`,
        [resetToken, tokenExpires, users[0].user_id]
      );
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: `"TMP App" <${process.env.BOT_EMAIL}>`,
        to: email,
        subject: 'Password Reset',
        html: `<p>Click <a href="${resetLink}">here</a> to reset. Expires in 1h.</p>`
      });
    }
    return res.json({ message: 'If this email exists, a reset link was sent', success: true });
  } catch (error) {
    console.error('[ForgotPassword] ERROR:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Resetear contraseña usando token
 */
const resetPassword = async (req, res) => {
  console.log('[ResetPassword] Request:', req.body);
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required', code: 'MISSING_FIELDS' });
    }

    const [rows] = await db.promise().query(
      `SELECT user_id FROM \`User\`
       WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.promise().query(
      `UPDATE \`User\`
         SET password = ?, reset_token = NULL, reset_token_expires = NULL
       WHERE user_id = ?`,
      [hashedPassword, rows[0].user_id]
    );
    return res.json({ message: 'Password updated successfully', success: true });
  } catch (error) {
    console.error('[ResetPassword] ERROR:', error);
    return res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

/**
 * Verificar si el usuario es admin
 */
const verifyAdmin = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ isAdmin: false, error: "Not logged in" });
  }
  const isAdmin = Number(req.user.role) > 0;
  console.log('[verifyAdmin] isAdmin:', isAdmin);
  res.json({ isAdmin });
};

/**
 * Middleware para rutas de admin
 */
const endpointAdminFilter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (Number(req.user.role) <= 0) {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  next();
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  verifyToken,
  getUser,
  forgotPassword,
  resetPassword,
  verifyAdmin,
  endpointAdminFilter
};
