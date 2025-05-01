const db = require('../config/db');
require('dotenv').config({path: '../.env'});

// GET all questions that belong to a specific tournament id
const getQuestions = async (req, res) => {
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

//esta funcion nos va a servir para:
//1. Recibir el codigo y datos asociados
//2. Mandar el codigo a la API de judge0
//3. Recibir la respuesta de la API de judge0 y 
//regresar al usuario la respuesta, asi como modificar datos en la DB dependiendo del resultado obtenido

const reviewQuestionSubmission = async (req, res) => {
  try {
    const { questionId, code, languageId } = req.body;

    console.log('[REVIEW] Question ID:', questionId);
    console.log('[REVIEW] Language ID:', languageId);
    console.log('[REVIEW] Submitted Code:\n', code);

    // 1. Fetch inputs and expected outputs from DB
    const [results] = await db.promise().query(
      'SELECT test_inputs, expected_outputs FROM Question WHERE question_id = ?',
      [questionId]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const { test_inputs, expected_outputs } = results[0];

    // 2. Call Judge0 API
    const judge0Response = await fetch(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.RAPIDAPI_TOKEN,
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: test_inputs,
          expected_output: expected_outputs,
        }),
      }
    );

    const resultData = await judge0Response.json();

    console.log('[JUDGE0] Response:', resultData);
    res.status(200).json(resultData);

  } catch (error) {
    console.error('[REVIEW ERROR]', error);
    res.status(500).json({ error: 'Failed to review submission' });
  }
};


module.exports = {
  getQuestions,
  getChallengeById,
  reviewQuestionSubmission
};

