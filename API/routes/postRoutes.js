const express = require('express');
const router = express.Router();
const { 
  getPosts, 
  getPostById, 
  createPost, 
  interactWithPost, 
  addComment, 
  giveHonorToComment 
} = require('../controllers/postController');
const { verifyToken } = require('../controllers/authController');

// Rutas públicas
router.get('/', getPosts);
router.get('/:id', getPostById);

// Rutas que requieren autenticación
router.post('/', verifyToken, createPost);
router.post('/:id/comments', verifyToken, addComment);
router.post('/comments/:commentId/honor', verifyToken, giveHonorToComment);
router.post('/:id/:type', verifyToken, interactWithPost);

module.exports = router; 