const express = require('express');
const router = express.Router();
const { 
  getPosts, 
  getPostById, 
  createPost, 
  interactWithPost, 
  addComment, 
  giveHonorToComment, 
  updateComment,
  deleteComment,
  deletePost,
  updatePostStatus,
  updatePost
} = require('../controllers/postController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', getPosts);
router.get('/:id', getPostById);

// Rutas que requieren autenticación
router.post('/', verifyToken, createPost);
router.post('/:id/comments', verifyToken, addComment);
router.post('/comments/:commentId/honor', verifyToken, giveHonorToComment);
router.post('/:id/:type', verifyToken, interactWithPost);

// Rutas para editar y eliminar comentarios (requieren autenticación)
router.put('/comments/:commentId', verifyToken, updateComment);
router.delete('/comments/:commentId', verifyToken, deleteComment);

// Rutas nuevas para posts
router.delete('/:id', verifyToken, deletePost);
router.put('/:id/status', verifyToken, requireAdmin, updatePostStatus);
router.put('/:id', verifyToken, updatePost);

module.exports = router; 