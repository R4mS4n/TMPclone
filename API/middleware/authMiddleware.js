const { verifyToken } = require('../controllers/authController');

// Middleware to protect admin routes
function requireAdmin(req, res, next) {
  // req.user comes from verifyToken middleware
  if (req.user?.role <= 0) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  csrfProtection
};
