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
  console.log('\n--- [JUDGE0 REVIEW] Starting code review process ---');
  try {
    const { questionId, code, languageId } = req.body;

    console.log('[JUDGE0 REVIEW] Question ID:', questionId);
    console.log('[JUDGE0 REVIEW] Language ID:', languageId);
    console.log('[JUDGE0 REVIEW] Code length:', code.length, 'characters');
    console.log('[JUDGE0 REVIEW] First 100 chars of code:', code.substring(0, 100));

    // 1. Fetch inputs and expected outputs from DB
    console.log('[JUDGE0 REVIEW] Fetching test inputs and expected outputs from database');
    const [results] = await db.promise().query(
      'SELECT test_inputs, expected_outputs, content FROM Question WHERE question_id = ?',
      [questionId]
    );

    if (results.length === 0) {
      console.error('[JUDGE0 REVIEW] Question not found with ID:', questionId);
      return res.status(404).json({ error: 'Question not found' });
    }

    const { test_inputs, expected_outputs, content } = results[0];
    console.log('[JUDGE0 REVIEW] Question content:', content);
    console.log('[JUDGE0 REVIEW] Test inputs:', test_inputs);
    console.log('[JUDGE0 REVIEW] Expected outputs:', expected_outputs);

    // Check if test inputs and expected outputs are properly set
    if (!test_inputs || !expected_outputs) {
      console.error('[JUDGE0 REVIEW] Missing test inputs or expected outputs for this question');
      return res.status(400).json({ 
        error: 'Question is missing test data',
        details: 'The question does not have test inputs or expected outputs configured'
      });
    }

    // Adjust the code if needed for proper evaluation
    let codeToEvaluate = code;

    // For Python specifically, ensure function results are printed to stdout
    if (languageId === 71) { // Python 3.10
      if (code.includes('def ') && !code.includes('print(')) {
        console.log('[JUDGE0 REVIEW] Adding print statements to Python code for proper evaluation');
        
        // Extract function name - this is a simple regex, may need to be improved
        const functionMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
        let functionName = "solution";  // Default function name if not found
        
        if (functionMatch && functionMatch[1]) {
          functionName = functionMatch[1];
        }
        
        // Add test code to print the function result
        if (test_inputs) {
          // Handle different possible formats of test_inputs
          const inputs = test_inputs.trim().split(/[\n,]/).filter(Boolean);
          console.log('[JUDGE0 REVIEW] Parsed test inputs:', inputs);
          
          // Generate appropriate print statements based on input type
          let testCases = [];
          
          inputs.forEach(input => {
            // Check if input is a string (contains letters)
            if (/[a-zA-Z]/.test(input)) {
              // Input is a string, add quotes
              testCases.push(`print(${functionName}("${input}"))`);
            } else {
              // Input is numeric
              testCases.push(`print(${functionName}(${input}))`);
            }
          });
          
          codeToEvaluate = `${code}\n\n# Test cases added for evaluation\n${testCases.join('\n')}`;
          console.log('[JUDGE0 REVIEW] Modified code with test cases:', codeToEvaluate);
        }
      }
    }

    // 2. Call Judge0 API
    console.log('[JUDGE0 REVIEW] Sending request to Judge0 API');
    console.log('[JUDGE0 REVIEW] Request params:', {
      language_id: languageId,
      stdin: test_inputs,
      expected_output: expected_outputs,
      code_length: codeToEvaluate.length
    });

    const apiKey = process.env.RAPIDAPI_TOKEN;
    if (!apiKey) {
      console.error('[JUDGE0 REVIEW] RAPIDAPI_TOKEN missing in environment variables');
      return res.status(500).json({ error: 'API key configuration error' });
    }
    
    console.log('[JUDGE0 REVIEW] API key found, proceeding with API call');
    
    const judge0Response = await fetch(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': apiKey,
        },
        body: JSON.stringify({
          source_code: codeToEvaluate,
          language_id: languageId,
          stdin: test_inputs,
          expected_output: expected_outputs,
        }),
      }
    );

    console.log('[JUDGE0 REVIEW] Judge0 API response status:', judge0Response.status);
    
    if (!judge0Response.ok) {
      console.error('[JUDGE0 REVIEW] Judge0 API error:', judge0Response.status, judge0Response.statusText);
      return res.status(judge0Response.status).json({ 
        error: `Judge0 API error: ${judge0Response.statusText}`,
        details: 'The code evaluation service returned an error'
      });
    }

    const resultData = await judge0Response.json();

    console.log('[JUDGE0 REVIEW] Judge0 response data:', JSON.stringify(resultData, null, 2));
    
    if (resultData.status) {
      console.log('[JUDGE0 REVIEW] Status ID:', resultData.status.id);
      console.log('[JUDGE0 REVIEW] Status description:', resultData.status.description);
      
      // Detailed comparison of expected vs actual for debugging
      console.log('[JUDGE0 REVIEW] Expected Output (from DB):', expected_outputs);
      console.log('[JUDGE0 REVIEW] Actual Output (stdout):', resultData.stdout);
      
      // Check for whitespace, newline or formatting issues
      if (resultData.status.id === 4) { // Wrong Answer
        const expectedNormalized = expected_outputs.trim().replace(/\r\n/g, '\n');
        const actualNormalized = resultData.stdout ? resultData.stdout.trim().replace(/\r\n/g, '\n') : '';
        
        console.log('[JUDGE0 REVIEW] Normalized Expected:', expectedNormalized);
        console.log('[JUDGE0 REVIEW] Normalized Actual:', actualNormalized);
        
        if (expectedNormalized === actualNormalized) {
          console.log('[JUDGE0 REVIEW] Outputs match after normalization - might be a newline/whitespace issue');
          // Override the status to "Accepted" if the only difference is whitespace/newlines
          resultData.status.id = 3;
          resultData.status.description = 'Accepted (after normalization)';
        } else {
          console.log('[JUDGE0 REVIEW] Outputs still don\'t match after normalization');
          console.log('[JUDGE0 REVIEW] Character-by-character comparison:');
          for (let i = 0; i < Math.max(expectedNormalized.length, actualNormalized.length); i++) {
            if (expectedNormalized[i] !== actualNormalized[i]) {
              console.log(`Difference at position ${i}: Expected '${expectedNormalized[i] || 'NONE'}' (${expectedNormalized.charCodeAt(i) || 'N/A'}) vs Actual '${actualNormalized[i] || 'NONE'}' (${actualNormalized.charCodeAt(i) || 'N/A'})`);
            }
          }
        }
      }
      
      if (resultData.status.id === 3) {
        console.log('[JUDGE0 REVIEW] Code execution successful!');
      } else {
        console.log('[JUDGE0 REVIEW] Code execution encountered issues');
      }
      
      if (resultData.stdout) console.log('[JUDGE0 REVIEW] stdout:', resultData.stdout);
      if (resultData.stderr) console.log('[JUDGE0 REVIEW] stderr:', resultData.stderr);
      if (resultData.compile_output) console.log('[JUDGE0 REVIEW] Compilation output:', resultData.compile_output);
      if (resultData.message) console.log('[JUDGE0 REVIEW] Message:', resultData.message);
    }
    
    console.log('[JUDGE0 REVIEW] Sending result data back to client');
    res.status(200).json(resultData);
    console.log('--- [JUDGE0 REVIEW] Code review process completed ---\n');

  } catch (error) {
    console.error('[JUDGE0 REVIEW ERROR] Unexpected error during code review:', error);
    res.status(500).json({ error: 'Failed to review submission', details: error.message });
    console.log('--- [JUDGE0 REVIEW] Code review process failed ---\n');
  }
};


module.exports = {
  getQuestions,
  getChallengeById,
  reviewQuestionSubmission
};

