// routes/adminRoutes.js

const express       = require('express');
const router        = express.Router();
const adminCtrl     = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Todas las rutas aquí requieren token válido y rol = 'admin'
router.use(verifyToken, requireAdmin);

router.get(   '/users',       adminCtrl.getAllUsers);
router.put(   '/users/:id',   adminCtrl.updateUser);
router.delete('/users/:id',   adminCtrl.deleteUser);

module.exports = router;
