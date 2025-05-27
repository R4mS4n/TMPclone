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
    // Ahora esperamos { username, email, password }
    const { username, mail: email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields must be filled" });
    }

    // Verificar usuario o email existentes
    const [existing] = await db.promise().query(
      "SELECT * FROM `User` WHERE username = ? OR mail = ?",
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hashear contraseña y generar token de verificación
    const salt              = await bcrypt.genSalt(10);
    const hashedPassword    = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires      = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert en la tabla (la columna sigue llamándose "mail")
    await db.promise().query(
      `INSERT INTO \`User\`
         (username, mail, password, verification_token, token_expires_at, is_verified)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [username, email, hashedPassword, verificationToken, tokenExpires]
    );

    // Enviar email de verificación
    const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: `"TMP App" <${process.env.BOT_EMAIL}>`,
      to: email,
      subject: 'Verify Your Email',
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #E31321;"; padding: 20px; text-align: center;">
                  <h2 style="color: white; margin: 0;">Welcome to TMP!</h2>
                </div>

                <div style="padding: 30px; color: #333; background-color: #fff;">
                  <p style="font-size: 16px;">Please confirm that you want to use this email in TMP, simply click the button below:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #f44336; color: white; padding: 14px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                      Verify email
                    </a>
                  </div>

                  <p style="font-size: 14px; color: #555;">The link will expire in 24 hours.</p>
                </div>

                <div style="padding: 15px; text-align: center; background-color: #fafafa; border-top: 1px solid #eee;">
                </div>
              </div>
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
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #3B3A3A;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .card {
              background-color: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
              text-align: center;
            }
            .success {
              color: #4CAF50;
              font-size: 24px;
              font-weight: bold;
            }
            .login-button {
              display: inline-block;
              margin-top: 20px;
              background-color: #f44336;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              transition: background-color 0.3s;
            }
            .login-button:hover {
              background-color: #d32f2f;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success">✓ Email Verified Successfully!</div>
            <a href="${process.env.FRONTEND_URL}/login" class="login-button">Go to Login</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[VERIFY EMAIL] error:', error);
    res.status(500).send('<h1>Server Error</h1><p>Please try again later.</p>');
  }
};

/**
 * Inicio de sesión (login)
 */
const loginUser = async (req, res) => {
  try {
    // Ahora destructuramos { email, password }
    const { email, password } = req.body;

    console.log('[LOGIN] email recibido:', email);
    console.log('[LOGIN] password raw:', password);
    console.log('[LOGIN] password.length:', password?.length);

    // Buscamos al usuario por la columna "mail"
    const [rows] = await db.promise().query(
      `SELECT user_id, username, password, role, is_verified
         FROM \`User\`
        WHERE mail = ?`,
      [email]
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
    return res.json({ message: "Login successful", token });
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
const getUser = async (req, res) => {
  try {
    const userId = req.user.sub;
    const [rows] = await db.promise().query(
      `SELECT user_id, username, role
         FROM \`User\`
        WHERE user_id = ?
        LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { user_id, username, role } = rows[0];
    return res.json({ user_id, username, role });
  } catch (err) {
    console.error('[GET /me] error:', err);
    return res.status(500).json({ error: err.message });
  }
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
