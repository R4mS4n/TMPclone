const db = require('../config/db');
const jwt = require('jsonwebtoken');

require('dotenv').config({path: '../.env'});

// GET all questions that belong to a specific tournament id
const getQuestions = async (req, res) => {
  try {
    const { challenge_id } = req.query;
    if (!challenge_id) return res.status(400).json({ error: '"challenge_id" is required' });

    const [questions] = await db.promise().query(
      'SELECT * FROM Question WHERE tournament_id = ? ORDER BY question_id ASC',
      [challenge_id]
    );

    res.status(200).json(questions);
  } catch (err) {
    console.error('[ERROR] Failed to fetch questions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// UPDATE questions
const updateQuestion = async (req, res) => {
  const { question_id } = req.params;
  const { content, language, topic, difficulty, test_inputs, expected_outputs } = req.body;

  if (!content || !language || !topic || !difficulty || !test_inputs || !expected_outputs) {
    return res.status(400).json({
      error: "All inputs are required."
    });
  }

  try {
    const [result] = await db.promise().query(
      `UPDATE Question 
       SET content = ?, language = ?, topic = ?, difficulty = ?, test_inputs = ?, expected_outputs = ?
       WHERE question_id = ?`,
      [content, language, topic, difficulty, test_inputs, expected_outputs, question_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({
      success: true,
      message: "Question updated successfully",
      question: { questionid, content, language, topic, difficulty, test_inputs, expected_outputs }
    });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: "Update failed",
      details: error.sqlMessage || error.message
    });
  }
};

// GET challenge by ID
const getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.promise().query(
      'SELECT * FROM Question WHERE question_id = ?',
      [id]
    );

    if (results.length === 0) return res.status(404).json({ error: 'Challenge not found' });

    res.json(results[0]);
  } catch (err) {
    console.error('[ERROR] Fetching challenge failed:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Review Question Submission and update score
const reviewQuestionSubmission = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = getUserIdFromToken(authHeader);
    const { questionId, code, languageId } = req.body;

    const [results] = await db.promise().query(
      'SELECT test_inputs, expected_outputs FROM Question WHERE question_id = ?',
      [questionId]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const { test_inputs, expected_outputs } = results[0];
    console.log(test_inputs, expected_outputs);
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

    const statusMapping = {
      'Accepted': 1,
      'Wrong Answer': 0,
      'Compilation Error': 0,
      'Runtime Error': 0,
      'Date Limit Exceeded': 0
      //base cases

    };
    const status = statusMapping[resultData.status?.description] ?? 0;

    await saveOrUpdateSubmission(userId, questionId, code, status);
    if (status !== -1) {
      await updateTournamentScore(userId, questionId);
    }

    res.status(200).json(resultData);

  } catch (error) {
    console.error('[REVIEW ERROR]', error);
    res.status(500).json({ error: 'Failed to review submission' });
  }
};

const getUserIdFromToken = (authHeader) => {
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new Error("Invalid Authorization header format. Expected 'Bearer <token>'");
  }

  const token = parts[1];

  try {
    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.sub) {
      throw new Error("Invalid JWT structure: 'sub' claim missing");
    }

    return decodedToken.sub;
  } catch (error) {
    throw new Error(`Invalid JWT: ${error.message}`);
  }
};

const saveOrUpdateSubmission = async (userId, questionId, code, status) => {
  try {
    await db.promise().query(
      `INSERT INTO Submission (user_id, question_id, code, status, created_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         code = VALUES(code), 
         status = VALUES(status), 
         created_at = NOW()`,
      [userId, questionId, code, status]
    );
    console.log(`Submission updated for user ${userId} on question ${questionId}`);
  } catch (error) {
    console.error('[DB ERROR] Failed to save submission:', error);
    throw error; // Re-throw to handle in calling function
  }
};

// Get a particular submission by providing user and question
const getSubmission = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
     if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }
    const userId = getUserIdFromToken(authHeader);
    const { questionId } = req.query;

    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const [results] = await db.promise().query(
      `SELECT code, status, created_at 
       FROM Submission 
       WHERE user_id = ? AND question_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId, questionId]
    );

    if (results.length === 0) {
       return res.status(404).json({ 
        error: 'No submission found',
        code: '',
        status: -1
      });
    }

    res.status(200).json({
      code: results[0].code,
      status: results[0].status,
      lastUpdated: results[0].created_at
    });

  } catch (error) {
    console.error('[ERROR] Fetching submission failed:', error);
    if (error.message.includes('JWT') || error.message.includes('token')) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Check if a question is solved by user
const checkQuestionStatus = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = getUserIdFromToken(authHeader);
    const { questionId } = req.query;

    const [result] = await db.promise().query(
      'SELECT status FROM Submission WHERE user_id = ? AND question_id = ? LIMIT 1',
      [userId, questionId]
    );

    if (result.length > 0 && result[0].status === 1) {
      return res.status(200).json({ solved: true });
    } else {
      return res.status(200).json({ solved: false });
    }

  } catch (error) {
    console.error('[ERROR] Checking question status failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update Tournament Score (Helper Function)
const updateTournamentScore = async (userId, questionId) => {
  const [question] = await db.promise().query(
    'SELECT tournament_id FROM Question WHERE question_id = ?', 
    [questionId]
  );
  if (!question.length) return;

  await db.promise().query(`
 INSERT INTO Tournament_Participation (user_id, tournament_id, score)
    SELECT 
      ?, ?,
      COALESCE(SUM(
        s.status * 
        CASE q.difficulty
          WHEN 'Easy' THEN 100
          WHEN 'Medium' THEN 200
          WHEN 'Hard' THEN 300
          ELSE 100
        END
      ), 0)
    FROM Submission s
    JOIN Question q ON s.question_id = q.question_id
    WHERE s.user_id = ? AND q.tournament_id = ?
    ON DUPLICATE KEY UPDATE score = VALUES(score)
  `, [userId, question[0].tournament_id, userId, question[0].tournament_id]);
};

module.exports = { 
  getQuestions, 
  updateQuestion,
  getChallengeById, 
  reviewQuestionSubmission,
  getSubmission,
  checkQuestionStatus
};
