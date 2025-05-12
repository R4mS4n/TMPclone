// middleware/authMiddleware.js

const { verifyToken } = require('../controllers/authController');

// Middleware para restringir acceso solo a admins (role > 0)
function requireAdmin(req, res, next) {
  // verifyToken debe haberse ejecutado antes y poblar req.user.role con un número
  if (!req.user || req.user.role <= 0) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin
};
