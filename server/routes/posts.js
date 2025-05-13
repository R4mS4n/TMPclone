const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all posts with sorting
router.get('/posts', async (req, res) => {
  try {
    const { sort, status } = req.query;
    let query = `
      SELECT 
        p.*,
        u.username,
        u.profile_pic,
        COALESCE(l.like_count, 0) as likes,
        COALESCE(c.comment_count, 0) as comments,
        COALESCE(v.view_count, 0) as views
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as like_count 
        FROM likes 
        GROUP BY post_id
      ) l ON p.post_id = l.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count 
        FROM comments 
        GROUP BY post_id
      ) c ON p.post_id = c.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as view_count 
        FROM views 
        GROUP BY post_id
      ) v ON p.post_id = v.post_id
    `;

    // Add WHERE clause for status if specified
    if (status === 'closed') {
      query += ' WHERE p.status = \'closed\'';
    }

    // Add ORDER BY clause based on sort parameter
    switch(sort) {
      case 'created_at':
        query += ' ORDER BY p.created_at DESC';
        break;
      case 'likes':
        query += ' ORDER BY likes DESC, p.created_at DESC';
        break;
      case 'views':
        query += ' ORDER BY views DESC, p.created_at DESC';
        break;
      default:
        query += ' ORDER BY p.created_at DESC';
    }

    const result = await db.query(query);
    
    // Transform the result to include interactions object
    const posts = result.rows.map(post => ({
      post_id: post.post_id,
      user_id: post.user_id,
      title: post.title,
      content: post.content,
      status: post.status,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user: {
        username: post.username,
        profile_pic: post.profile_pic
      },
      interactions: {
        likes: parseInt(post.likes),
        comments: parseInt(post.comments),
        views: parseInt(post.views)
      }
    }));

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Middleware to check if post is closed
const checkPostStatus = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const result = await db.query('SELECT status FROM posts WHERE post_id = $1', [postId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (result.rows[0].status === 'closed') {
      return res.status(403).json({ message: 'This post is closed. No new comments or interactions are allowed.' });
    }

    next();
  } catch (error) {
    console.error('Error checking post status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add comment to a post
router.post('/posts/:postId/comments', auth, checkPostStatus, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // From auth middleware

    const result = await db.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [postId, userId, content]
    );

    // Get user info for the response
    const userResult = await db.query(
      'SELECT username, profile_pic FROM users WHERE user_id = $1',
      [userId]
    );

    const comment = {
      ...result.rows[0],
      user: userResult.rows[0],
      honor_count: 0
    };

    res.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Give honor to a comment
router.post('/posts/comments/:commentId/honor', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // First check if the comment belongs to a closed post
    const postStatusResult = await db.query(`
      SELECT p.status 
      FROM posts p 
      JOIN comments c ON c.post_id = p.post_id 
      WHERE c.comment_id = $1
    `, [commentId]);

    if (postStatusResult.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (postStatusResult.rows[0].status === 'closed') {
      return res.status(403).json({ message: 'Cannot give honor to comments in closed posts' });
    }

    // Check if user has already honored this comment
    const honorExists = await db.query(
      'SELECT * FROM comment_honors WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );

    if (honorExists.rows.length > 0) {
      // Remove honor if it exists
      await db.query(
        'DELETE FROM comment_honors WHERE comment_id = $1 AND user_id = $2',
        [commentId, userId]
      );
      res.json({ message: 'Honor removed' });
    } else {
      // Add new honor
      await db.query(
        'INSERT INTO comment_honors (comment_id, user_id) VALUES ($1, $2)',
        [commentId, userId]
      );
      res.json({ message: 'Honor added' });
    }
  } catch (error) {
    console.error('Error handling honor:', error);
    res.status(500).json({ message: 'Error processing honor request' });
  }
});

// Like/unlike a post
router.post('/posts/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post is closed
    const postStatusResult = await db.query(
      'SELECT status FROM posts WHERE post_id = $1',
      [postId]
    );

    if (postStatusResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (postStatusResult.rows[0].status === 'closed') {
      return res.status(403).json({ message: 'Cannot like closed posts' });
    }

    // Check if user has already liked this post
    const likeExists = await db.query(
      'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (likeExists.rows.length > 0) {
      // Remove like if it exists
      await db.query(
        'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      res.json({ message: 'Like removed' });
    } else {
      // Add new like
      await db.query(
        'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
        [postId, userId]
      );
      res.json({ message: 'Like added' });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    res.status(500).json({ message: 'Error processing like request' });
  }
});

// ... rest of your routes ... 