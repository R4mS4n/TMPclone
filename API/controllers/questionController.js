const db = require('../config/db');

// GET /api/questions?challenge_id=8
const getQuestions = async (req, res) => {
  console.log('--- [GET /api/questions] Incoming Request ---');

  try {
    const { challenge_id } = req.query;

    console.log('[INFO] Query params:', req.query);

    if (!challenge_id) {
      console.warn('[WARN] Missing "challenge_id" in query');
      return res.status(400).json({ error: '"challenge_id" is required' });
    }

    const query = `
      SELECT * FROM Question
      WHERE tournament_id = ?
      ORDER BY question_id ASC
    `;

    console.log(`[INFO] Running SQL:\n${query}`);
    console.log(`[INFO] With parameters: [${challenge_id}]`);

    const [questions] = await db.promise().query(query, [challenge_id]);

    console.log(`[SUCCESS] Retrieved ${questions.length} question(s)`);
    res.status(200).json(questions);
  } catch (err) {
    console.error('[ERROR] Failed to fetch questions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }

  console.log('--- [GET /api/questions] End ---\n');
};

//get challenge by id
const getChallengeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.promise().query(
      "SELECT * FROM Question WHERE question_id = ?",
      [id]
    );
    if (results.length === 0) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    res.json(results[0]); // Send the specific challenge object
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getQuestions,
  getChallengeById
};

