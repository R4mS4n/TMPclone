const express = require('express');
const router = express.Router();
const {getQuestions, getChallengeById, reviewQuestionSubmission} = require('../controllers/questionController');

router.get('/getAllQuestions', getQuestions);
router.get('/:id', getChallengeById);
router.post('/review', reviewQuestionSubmission)

module.exports = router;

