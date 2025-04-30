const express = require('express');
const router = express.Router();
const { checkAchievements } = require('../controllers/achievementController');

// Ruta temporal para probar la asignación de logros
router.get('/check/:user_id', async (req, res) => {
  const user_id = req.params.user_id;

  try {
    console.log(`🔍 Verificando logros para el usuario ${user_id}`);
    await checkAchievements(user_id);
    res.json({ message: `✅ Achievements checked for user ${user_id}` });
  } catch (error) {
    console.error('❌ Error en ruta /dev/check:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
