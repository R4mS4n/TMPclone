const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Asigna un logro si aún no lo tiene
async function assignAchievement(user_id, achievement_id) {
  const [exists] = await db.promise().query(
    'SELECT * FROM User_Achievement WHERE user_id = ? AND achievement_id = ?',
    [user_id, achievement_id]
  );

  if (exists.length === 0) {
    await db.promise().query(
      'INSERT INTO User_Achievement (user_id, achievement_id, obtained_date) VALUES (?, ?, NOW())',
      [user_id, achievement_id]
    );
    console.log(`✅ Achievement ${achievement_id} assigned to user ${user_id}`);
  }
}

// Verifica todos los logros para un usuario
async function checkAchievements(user_id) {
  try {
    const conn = db.promise();

    // 🏆 1. Participó en su primer torneo
    const [tournaments] = await conn.query(
      'SELECT * FROM Tournament_Participation WHERE user_id = ?',
      [user_id]
    );
    console.log(`[LOGRO 1] Participaciones en torneo: ${tournaments.length}`);
    if (tournaments.length > 0) {
      await assignAchievement(user_id, 1);
    }

    // 🏆 2. Completó su primer challenge
    const [progress] = await conn.query(
      'SELECT solved_problems FROM Progress_Report WHERE user_id = ?',
      [user_id]
    );
    console.log(`[LOGRO 2] Problemas resueltos:`, progress[0]?.solved_problems || 0);
    if (progress.length > 0 && progress[0].solved_problems >= 1) {
      await assignAchievement(user_id, 2);
    }

    // 🏆 3. Llegó al nivel 5
    const [user] = await conn.query(
      'SELECT level FROM User WHERE user_id = ?',
      [user_id]
    );
    console.log(`[LOGRO 3] Nivel del usuario ${user_id}:`, user[0]?.level);
    if (user.length > 0 && user[0].level >= 5) {
      await assignAchievement(user_id, 3);
    }

    // 🏆 4. Top 5 en leaderboard
    const [ranking] = await conn.query(
      'SELECT position FROM Leaderboard WHERE user_id = ? ORDER BY position ASC LIMIT 1',
      [user_id]
    );
    console.log(`[LOGRO 4] Posición más alta:`, ranking[0]?.position);
    if (ranking.length > 0 && ranking[0].position <= 5) {
      await assignAchievement(user_id, 4);
    }

    // 🏆 5. Torneo en equipo
    const [userInfo] = await conn.query(
      'SELECT team_id FROM User WHERE user_id = ?',
      [user_id]
    );
    console.log(`[LOGRO 5] Team ID:`, userInfo[0]?.team_id);
    if (
      userInfo.length > 0 &&
      userInfo[0].team_id !== null &&
      tournaments.length > 0
    ) {
      await assignAchievement(user_id, 5);
    }

  } catch (error) {
    console.error('❌ Error checking achievements:', error);
  }
}

// Consulta todos los logros del usuario
async function getUserAchievements(req, res) {
  const user_id = req.params.user_id;

  try {
    const conn = db.promise();
    const [allAchievements] = await conn.query('SELECT * FROM Achievement');
    const [userAchievements] = await conn.query(
      'SELECT achievement_id FROM User_Achievement WHERE user_id = ?',
      [user_id]
    );

    const unlockedIds = userAchievements.map(a => a.achievement_id);
    const result = allAchievements.map((ach) => ({
      ...ach,
      unlocked: unlockedIds.includes(ach.achievement_id)
    }));

    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching user achievements:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  checkAchievements,
  getUserAchievements
};
