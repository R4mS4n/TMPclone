const { verifyToken } = require('../controllers/authController');

// Middleware para restringir acceso solo a admins (role > 0)
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role <= 0) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
  }
  next();
}

// Middleware para superadmin (rol === 2, por ejemplo)
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 2) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol superadmin' });
  }
  next();
}

// Puedes usar esta función en controladores si necesitas lógica condicional
const hasPermission = (editorRole, targetRole) => {
  if (editorRole === 2) return true; // superadmin puede editar/borrar todo
  if (editorRole === 1 && targetRole === 0) return true; // admin solo puede modificar a usuarios normales
  return false;
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  hasPermission
};
