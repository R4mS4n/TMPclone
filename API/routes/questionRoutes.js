const express = require('express');
const router = express.Router();
const {getQuestions, getChallengeById} = require('../controllers/questionController');

router.get('/getAllQuestions', getQuestions);
router.get('/:id', getChallengeById);

module.exports = router;

