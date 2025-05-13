const express = require('express');
const router = express.Router();
const {getQuestions, getChallengeById, reviewQuestionSubmission} = require('../controllers/questionController');

router.get('/getAllQuestions', getQuestions);
router.get('/:id', getChallengeById);
router.post('/review', reviewQuestionSubmission);

// Special debugging endpoint to help with Judge0 integration
router.get('/admin/debug/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/db');
    
    console.log('\n--- [ADMIN DEBUG] Checking question data ---');
    console.log('[ADMIN DEBUG] Querying question ID:', id);
    
    // Get question data including test inputs and expected outputs
    const [results] = await db.promise().query(
      'SELECT * FROM Question WHERE question_id = ?',
      [id]
    );
    
    if (results.length === 0) {
      console.log('[ADMIN DEBUG] Question not found');
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = results[0];
    
    // Diagnose test data
    const diagnosis = {
      question_id: question.question_id,
      content: question.content,
      hasTestInputs: !!question.test_inputs,
      hasExpectedOutputs: !!question.expected_outputs,
      testInputsLength: question.test_inputs ? question.test_inputs.length : 0,
      expectedOutputsLength: question.expected_outputs ? question.expected_outputs.length : 0,
      testInputs: question.test_inputs,
      expectedOutputs: question.expected_outputs,
      suggestedFixes: []
    };
    
    // Basic validation
    if (!question.test_inputs) {
      diagnosis.suggestedFixes.push('Add test inputs to the question');
    }
    
    if (!question.expected_outputs) {
      diagnosis.suggestedFixes.push('Add expected outputs to the question');
    }
    
    // Check for common whitespace/newline issues
    if (question.test_inputs && question.expected_outputs) {
      if (question.expected_outputs.trim() === '') {
        diagnosis.suggestedFixes.push('Expected outputs are empty or whitespace only');
      }
      
      if (question.expected_outputs.endsWith('\n') || question.expected_outputs.endsWith('\r\n')) {
        diagnosis.suggestedFixes.push('Expected outputs end with a newline - this might cause comparison issues');
      }
      
      // Check for data format that doesn't match the expected judge0 format
      if (question.test_inputs.includes('(') || question.test_inputs.includes(')')) {
        diagnosis.suggestedFixes.push('Test inputs may include function call syntax - remove parentheses and just include the arguments');
      }
    }
    
    console.log('[ADMIN DEBUG] Diagnosis:', diagnosis);
    console.log('--- [ADMIN DEBUG] End ---\n');
    
    res.json(diagnosis);
  } catch (error) {
    console.error('[ADMIN DEBUG ERROR]', error);
    res.status(500).json({ error: 'Failed to debug question', details: error.message });
  }
});

module.exports = router;

