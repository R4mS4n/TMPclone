const db = require('../config/db');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

// Obtener todos los posts con filtro por estado (new, hot, top, closed)
const getPosts = async (req, res) => {
  try {
    const { sort_by, filter_status } = req.query; // Renamed parameters for clarity

    let query = `
      SELECT 
        p.post_id, 
        p.title, 
        p.content, 
        p.status, 
        p.created_at,
        u.user_id,
        u.username,
        (SELECT CONVERT(u_pic.profile_pic USING utf8) FROM User u_pic WHERE u_pic.user_id = p.user_id) as profile_pic,
        (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id AND c.status = 'active') as comment_count,
        (SELECT COUNT(*) FROM Post_Interaction pi WHERE pi.post_id = p.post_id AND pi.interaction_type = 'view') as view_count,
        (SELECT COUNT(*) FROM Post_Interaction pi WHERE pi.post_id = p.post_id AND pi.interaction_type = 'like') as like_count
      FROM Post p
      JOIN User u ON p.user_id = u.user_id
    `;

    let whereClauses = [];
    let queryParams = [];
    let orderByClause = 'ORDER BY p.created_at DESC'; // Default for 'new' or no sort specified

    if (filter_status === 'closed') {
      whereClauses.push('p.status = ?');
      queryParams.push('closed');
      // orderByClause remains p.created_at DESC for closed posts, or could be different if needed
    } else {
      // For 'new', 'top', 'hot', and default: show non-closed posts
      whereClauses.push("p.status != 'closed'");
      // queryParams.push('closed'); // Not needed for != 'closed' as it's a literal

      if (sort_by === 'likes') { // Corresponds to 'Top'
        orderByClause = 'ORDER BY like_count DESC, p.created_at DESC';
      } else if (sort_by === 'comments') { // Corresponds to 'Hot'
        orderByClause = 'ORDER BY comment_count DESC, p.created_at DESC';
      }
      // If sort_by is 'created_at' or undefined, the default orderByClause will be used.
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    query += ` ${orderByClause}`;
    query += ` LIMIT 50`; // Apply limit after ordering and filtering

    const [posts] = await db.promise().query(query, queryParams);

    let userLikes = new Set();
    const authHeader = req.headers.authorization;
    let currentUserId = null;

    if (process.env.JWT_SECRET && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.sub) {
          currentUserId = decoded.sub;
        }
      } catch (err) {
        console.warn('JWT error in getPosts (non-critical, proceeding without user like statuses):', err.message);
      }
    }

    if (currentUserId && posts.length > 0) {
      const postIds = posts.map(p => p.post_id);
      const [likeRecords] = await db.promise().query(
        'SELECT post_id FROM Post_Interaction WHERE user_id = ? AND interaction_type = \'like\' AND post_id IN (?)',
        [currentUserId, postIds]
      );
      likeRecords.forEach(record => userLikes.add(record.post_id));
    }

    for (const post of posts) {
      const [tags] = await db.promise().query(
        `SELECT t.name 
         FROM Tag t
         JOIN Post_Tag pt ON t.tag_id = pt.tag_id
         WHERE pt.post_id = ?`,
        [post.post_id]
      );
      
      post.tags = tags.map(tag => tag.name);
      
      post.user = {
        user_id: post.user_id,
        username: post.username,
        profile_pic: post.profile_pic
      };
      
      post.interactions = {
        comments: post.comment_count || 0,
        views: post.view_count || 0,
        likes: post.like_count || 0
      };
      
      post.currentUserHasLiked = userLikes.has(post.post_id);
      
      delete post.user_id;
      delete post.username;
      delete post.profile_pic;
      delete post.comment_count;
      delete post.view_count;
      delete post.like_count;
    }

    res.status(200).json(posts);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Obtener un post específico por id con sus comentarios
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener el post
    const [posts] = await db.promise().query(
      `SELECT 
        p.post_id, 
        p.title, 
        p.content, 
        p.status, 
        p.created_at,
        u.user_id,
        u.username,
        (SELECT CONVERT(u.profile_pic USING utf8) FROM User u WHERE u.user_id = p.user_id) as profile_pic,
        (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id AND c.status = 'active') as comment_count,
        (SELECT COUNT(*) FROM Post_Interaction pi WHERE pi.post_id = p.post_id AND pi.interaction_type = 'view') as view_count,
        (SELECT COUNT(*) FROM Post_Interaction pi WHERE pi.post_id = p.post_id AND pi.interaction_type = 'like') as like_count
      FROM Post p
      JOIN User u ON p.user_id = u.user_id
      WHERE p.post_id = ?`,
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const post = posts[0];
    
    // Obtener las etiquetas
    const [tags] = await db.promise().query(
      `SELECT t.name 
       FROM Tag t
       JOIN Post_Tag pt ON t.tag_id = pt.tag_id
       WHERE pt.post_id = ?`,
      [id]
    );
    
    post.tags = tags.map(tag => tag.name);
    
    // Determine if current user has liked this post
    let currentUserHasLiked = false;
    const authHeader = req.headers.authorization;
    let currentUserId = null;

    if (process.env.JWT_SECRET && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.sub) {
          currentUserId = decoded.sub;
          const [likeStatus] = await db.promise().query(
            'SELECT 1 FROM Post_Interaction WHERE post_id = ? AND user_id = ? AND interaction_type = \'like\' LIMIT 1',
            [id, currentUserId]
          );
          currentUserHasLiked = likeStatus.length > 0;
        }
      } catch (err) {
        console.warn('JWT error in getPostById (non-critical, proceeding without user like status):', err.message);
        // Token might be invalid or expired, or JWT_SECRET might be missing/wrong.
        // currentUserHasLiked remains false.
      }
    } else if (authHeader && authHeader.startsWith('Bearer ') && !process.env.JWT_SECRET) {
      console.warn('JWT_SECRET is not set. Cannot determine user like status in getPostById.');
    }
    
    // Obtener los comentarios
    const [comments] = await db.promise().query(
      `SELECT 
        c.comment_id,
        c.content,
        c.created_at,
        c.updated_at, 
        c.status,
        u.user_id,
        u.username,
        (SELECT CONVERT(u.profile_pic USING utf8) FROM User u WHERE u.user_id = c.user_id) as profile_pic,
        (SELECT COUNT(*) FROM Honor h WHERE h.comment_id = c.comment_id) as honor_count
      FROM Comment c
      JOIN User u ON c.user_id = u.user_id
      WHERE c.post_id = ? AND c.status = 'active'
      ORDER BY c.created_at DESC`,
      [id]
    );
    
    let userHonorRecords = new Map();
    if (currentUserId && comments.length > 0) {
      const commentIds = comments.map(c => c.comment_id);
      const [honorRecords] = await db.promise().query(
        'SELECT comment_id, given_by_user_id FROM Honor WHERE given_by_user_id = ? AND comment_id IN (?)',
        [currentUserId, commentIds]
      );
      honorRecords.forEach(record => {
        if (!userHonorRecords.has(record.comment_id)) {
          userHonorRecords.set(record.comment_id, new Set());
        }
        userHonorRecords.get(record.comment_id).add(record.given_by_user_id);
      });
    }
    
    const formattedComments = comments.map(comment => ({
      comment_id: comment.comment_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      status: comment.status,
      honor_count: comment.honor_count || 0,
      currentUserHasHonored: userHonorRecords.has(comment.comment_id) && userHonorRecords.get(comment.comment_id).has(currentUserId),
      user: {
        user_id: comment.user_id,
        username: comment.username,
        profile_pic: comment.profile_pic
      }
    }));
    
    const formattedPost = {
      post_id: post.post_id,
      title: post.title,
      content: post.content,
      status: post.status,
      created_at: post.created_at,
      tags: post.tags,
      user: {
        user_id: post.user_id,
        username: post.username,
        profile_pic: post.profile_pic
      },
      interactions: {
        comments: post.comment_count || 0,
        views: post.view_count || 0,
        likes: post.like_count || 0
      },
      comments: formattedComments,
      currentUserHasLiked
    };
    
    res.status(200).json(formattedPost);
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Crear un nuevo post
const createPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const user_id = req.user.sub; // Using sub from JWT claims
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    // Insertar el post
    const [result] = await db.promise().query(
      'INSERT INTO Post (user_id, title, content, status) VALUES (?, ?, ?, ?)',
      [user_id, title, content, 'new']
    );
    
    const post_id = result.insertId;
    
    // Procesar etiquetas si existen
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        // Verificar si la etiqueta ya existe
        const [existingTags] = await db.promise().query(
          'SELECT tag_id FROM Tag WHERE name = ?',
          [tagName]
        );
        
        let tag_id;
        
        if (existingTags.length > 0) {
          tag_id = existingTags[0].tag_id;
        } else {
          // Crear nueva etiqueta
          const [newTag] = await db.promise().query(
            'INSERT INTO Tag (name) VALUES (?)',
            [tagName]
          );
          tag_id = newTag.insertId;
        }
        
        // Asignar etiqueta al post
        await db.promise().query(
          'INSERT INTO Post_Tag (post_id, tag_id) VALUES (?, ?)',
          [post_id, tag_id]
        );
      }
    }
    
    // Obtener el post creado con todos sus detalles
    const [posts] = await db.promise().query(
      `SELECT 
        p.post_id, 
        p.title, 
        p.content, 
        p.status, 
        p.created_at,
        u.user_id,
        u.username,
        (SELECT CONVERT(u.profile_pic USING utf8) FROM User u WHERE u.user_id = p.user_id) as profile_pic
      FROM Post p
      JOIN User u ON p.user_id = u.user_id
      WHERE p.post_id = ?`,
      [post_id]
    );
    
    const post = posts[0];
    
    // Obtener las etiquetas
    const [tagResults] = await db.promise().query(
      `SELECT t.name 
       FROM Tag t
       JOIN Post_Tag pt ON t.tag_id = pt.tag_id
       WHERE pt.post_id = ?`,
      [post_id]
    );
    
    // Formatear la respuesta
    const formattedPost = {
      post_id: post.post_id,
      title: post.title,
      content: post.content,
      status: post.status,
      created_at: post.created_at,
      tags: tagResults.map(tag => tag.name),
      user: {
        user_id: post.user_id,
        username: post.username,
        profile_pic: post.profile_pic
      },
      interactions: {
        comments: 0,
        views: 0,
        likes: 0
      }
    };
    
    res.status(201).json(formattedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Registrar una interacción con un post (like o view)
const interactWithPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.params; // 'like' o 'view'
    const user_id = req.user.sub; // Using sub from JWT claims
    
    if (type === 'like') {
      const [existingLikes] = await db.promise().query(
        'SELECT * FROM Post_Interaction WHERE post_id = ? AND user_id = ? AND interaction_type = \'like\'',
        [id, user_id]
      );

      let currentUserHasLikedAfterToggle;
      if (existingLikes.length > 0) {
        // User has liked, so unlike
        await db.promise().query(
          'DELETE FROM Post_Interaction WHERE post_id = ? AND user_id = ? AND interaction_type = \'like\'',
          [id, user_id]
        );
        currentUserHasLikedAfterToggle = false;
      } else {
        // User has not liked, so like
        await db.promise().query(
          'INSERT INTO Post_Interaction (post_id, user_id, interaction_type) VALUES (?, ?, \'like\')',
          [id, user_id]
        );
        currentUserHasLikedAfterToggle = true;
      }
      
      const [updatedInteractions] = await db.promise().query(
        'SELECT COUNT(*) as count FROM Post_Interaction WHERE post_id = ? AND interaction_type = \'like\'',
        [id]
      );
      return res.status(200).json({ 
        message: currentUserHasLikedAfterToggle ? 'Like registered successfully' : 'Like removed', 
        count: updatedInteractions[0].count,
        currentUserHasLiked: currentUserHasLikedAfterToggle 
      });

    } else if (type === 'view') {
      // Add view interaction only if it doesn't exist for this user and post
      const [existingViews] = await db.promise().query(
         'SELECT * FROM Post_Interaction WHERE post_id = ? AND user_id = ? AND interaction_type = \'view\'',
         [id, user_id]
      );
      if (existingViews.length === 0) {
        await db.promise().query(
          'INSERT INTO Post_Interaction (post_id, user_id, interaction_type) VALUES (?, ?, \'view\')',
          [id, user_id]
        );
      }
      
      // Get total views for the post
      const [interactions] = await db.promise().query(
        'SELECT COUNT(*) as count FROM Post_Interaction WHERE post_id = ? AND interaction_type = \'view\'',
        [id]
      );
      return res.status(200).json({ 
        message: 'View interaction processed', 
        count: interactions[0].count 
      });
    } else {
      return res.status(400).json({ message: 'Invalid interaction type' });
    }
  } catch (error) {
    console.error(`Error during ${type} interaction:`, error); // Use type from params
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Agregar un comentario a un post
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.sub; // Using sub from JWT claims
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Verificar si el post existe
    const [posts] = await db.promise().query(
      'SELECT * FROM Post WHERE post_id = ?',
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Crear el comentario
    const [result] = await db.promise().query(
      'INSERT INTO Comment (post_id, user_id, content) VALUES (?, ?, ?)',
      [id, user_id, content]
    );
    
    const comment_id = result.insertId;
    
    // Obtener el comentario con los datos del usuario
    const [comments] = await db.promise().query(
      `SELECT 
        c.comment_id,
        c.content,
        c.created_at,
        c.status,
        u.user_id,
        u.username,
        (SELECT CONVERT(u.profile_pic USING utf8) FROM User u WHERE u.user_id = c.user_id) as profile_pic
      FROM Comment c
      JOIN User u ON c.user_id = u.user_id
      WHERE c.comment_id = ?`,
      [comment_id]
    );
    
    const comment = comments[0];
    
    // Formatear la respuesta
    const formattedComment = {
      comment_id: comment.comment_id,
      content: comment.content,
      created_at: comment.created_at,
      status: comment.status,
      honor_count: 0,
      user: {
        user_id: comment.user_id,
        username: comment.username,
        profile_pic: comment.profile_pic
      }
    };
    
    res.status(201).json(formattedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Dar honor a un comentario
const giveHonorToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const user_id = req.user.sub; // Using sub from JWT claims
    
    // Verificar si el comentario existe
    const [comments] = await db.promise().query(
      'SELECT * FROM Comment WHERE comment_id = ?',
      [commentId]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Prevent honoring your own comment
    if (comments[0].user_id === user_id) {
      return res.status(403).json({ message: 'You cannot honor your own comment' });
    }
    
    // Verificar si el usuario ya dio honor a este comentario
    const [existingHonors] = await db.promise().query(
      'SELECT * FROM Honor WHERE comment_id = ? AND given_by_user_id = ?',
      [commentId, user_id]
    );

    console.log(`[giveHonorToComment] START - CommentID: ${commentId}, UserGivingID: ${user_id}, UserReceivingID: ${comments[0].user_id}, Action: ${existingHonors.length > 0 ? 'Attempt REMOVE' : 'Attempt GIVE'}`);
    
    if (existingHonors.length > 0) {
      // Si ya dio honor, eliminarlo (toggle)
      console.log(`[giveHonorToComment] REMOVING Honor - Before Honor DELETE for comment: ${commentId}, by user: ${user_id}`);
      await db.promise().query(
        'DELETE FROM Honor WHERE comment_id = ? AND given_by_user_id = ?',
        [commentId, user_id]
      );
      console.log(`[giveHonorToComment] REMOVING Honor - After Honor DELETE. User_Honor_Total will be updated by trigger.`);
      
      return res.status(200).json({ message: 'Honor removed', currentUserHasHonored: false, count: (await db.promise().query('SELECT COUNT(*) as count FROM Honor WHERE comment_id = ?', [commentId]))[0][0].count });
    }
    
    // Dar honor al comentario
    console.log(`[giveHonorToComment] GIVING Honor - Before Honor INSERT for comment: ${commentId}, by user: ${user_id}`);
    await db.promise().query(
      'INSERT INTO Honor (comment_id, given_by_user_id) VALUES (?, ?)',
      [commentId, user_id]
    );
    console.log(`[giveHonorToComment] GIVING Honor - After Honor INSERT. User_Honor_Total will be updated by trigger.`);
    
    // Obtener el conteo actualizado
    const [honors] = await db.promise().query(
      'SELECT COUNT(*) as count FROM Honor WHERE comment_id = ?',
      [commentId]
    );
    
    console.log(`[giveHonorToComment] END - Responding for CommentID: ${commentId}`);
    res.status(200).json({ 
      message: 'Honor given successfully',
      currentUserHasHonored: true,
      count: honors[0].count
    });
  } catch (error) {
    console.error('Error giving honor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a comment
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const user_id = req.user.sub; // Using sub from JWT claims

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Verify if the comment exists and belongs to the user
    const [comments] = await db.promise().query(
      'SELECT * FROM Comment WHERE comment_id = ? AND user_id = ?',
      [commentId, user_id]
    );

    if (comments.length === 0) {
      // Check if comment exists but belongs to another user or doesn't exist
      const [anyComment] = await db.promise().query('SELECT * FROM Comment WHERE comment_id = ?', [commentId]);
      if (anyComment.length === 0) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      return res.status(403).json({ message: 'You are not authorized to edit this comment' });
    }

    // Update the comment
    await db.promise().query(
      'UPDATE Comment SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE comment_id = ?',
      [content, commentId]
    );

    // Get the updated comment with user info
    const [updatedComments] = await db.promise().query(
      `SELECT 
        c.comment_id,
        c.content,
        c.created_at,
        c.updated_at,
        c.status,
        u.user_id,
        u.username,
        (SELECT CONVERT(u.profile_pic USING utf8) FROM User u WHERE u.user_id = c.user_id) as profile_pic,
        (SELECT COUNT(*) FROM Honor h WHERE h.comment_id = c.comment_id) as honor_count
      FROM Comment c
      JOIN User u ON c.user_id = u.user_id
      WHERE c.comment_id = ?`,
      [commentId]
    );

    const updatedComment = updatedComments[0];

    // Formatear la respuesta
    const formattedComment = {
      comment_id: updatedComment.comment_id,
      content: updatedComment.content,
      created_at: updatedComment.created_at,
      updated_at: updatedComment.updated_at,
      status: updatedComment.status,
      honor_count: updatedComment.honor_count || 0,
      user: {
        user_id: updatedComment.user_id,
        username: updatedComment.username,
        profile_pic: updatedComment.profile_pic
      }
    };

    res.status(200).json(formattedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a comment (soft delete)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const user_id = req.user.sub; // Using sub from JWT claims

    // Verify if the comment exists and belongs to the user
    const [comments] = await db.promise().query(
      'SELECT * FROM Comment WHERE comment_id = ? AND user_id = ?',
      [commentId, user_id]
    );

    if (comments.length === 0) {
      const [anyComment] = await db.promise().query('SELECT * FROM Comment WHERE comment_id = ?', [commentId]);
      if (anyComment.length === 0) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      return res.status(403).json({ message: 'You are not authorized to delete this comment' });
    }

    // Soft delete the comment by updating its status
    // Also clear content and mark as edited to prevent confusion
    await db.promise().query(
      "UPDATE Comment SET content = '[deleted]', status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE comment_id = ?",
      [commentId]
    );

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Eliminar un post (solo autor o admin)
const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub; // ID del usuario que hace la petición
  const userRoles = req.user.roles || []; // Roles del usuario

  try {
    const [posts] = await db.promise().query('SELECT user_id FROM Post WHERE post_id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postAuthorId = posts[0].user_id;

    if (postAuthorId !== userId && !userRoles.includes('admin')) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this post.' });
    }

    // Consider a soft delete (setting status to 'deleted') or hard delete
    // For now, let's do a hard delete for simplicity. 
    // Dependencies like comments, likes, tags might need to be handled (e.g., ON DELETE CASCADE in DB)
    await db.promise().query('DELETE FROM Post_Tag WHERE post_id = ?', [id]);
    await db.promise().query('DELETE FROM Comment WHERE post_id = ?', [id]); // Assuming comments should be deleted too
    await db.promise().query('DELETE FROM Post_Interaction WHERE post_id = ?', [id]);
    await db.promise().query('DELETE FROM Post WHERE post_id = ?', [id]);

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};

// Actualizar el estado de un post (solo admin)
const updatePostStatus = async (req, res) => {
  console.log('[updatePostStatus] req.user:', req.user); // Log req.user
  const { id } = req.params;
  const { status } = req.body;
  // Assuming 'req.user.role' is populated by your verifyToken middleware
  // and a role > 0 indicates an admin. Adjust if your claim name or admin value differs.
  const userRole = req.user.role; 

  // Check if the user is an admin (role > 0 or specific admin role ID)
  if (!userRole || userRole <= 0) { // Or use a more specific check like 'userRole !== 1' if 1 is admin
    return res.status(403).json({ message: 'Forbidden: Only admins can change post status.' });
  }

  if (!status || !['active', 'closed', 'pending_review'].includes(status)) { // Add more valid statuses if needed
    return res.status(400).json({ message: 'Invalid status provided. Valid statuses are: active, closed, pending_review.' });
  }

  try {
    const [posts] = await db.promise().query('SELECT post_id FROM Post WHERE post_id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await db.promise().query('UPDATE Post SET status = ? WHERE post_id = ?', [status, id]);

    res.status(200).json({ message: `Post status updated to ${status}` });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ message: 'Failed to update post status', error: error.message });
  }
};

// Actualizar un post (solo autor)
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;
  const userId = req.user.sub; // ID del usuario que hace la petición

  if (!title || title.trim() === '' || !content || content.trim() === '') {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const [posts] = await db.promise().query('SELECT user_id FROM Post WHERE post_id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to update this post.' });
    }

    await db.promise().query(
      'UPDATE Post SET title = ?, content = ? WHERE post_id = ?',
      [title, content, id]
    );

    // Handle tags: delete existing, then add new ones
    // This is a simple way; more complex logic might be needed for performance or to avoid deleting/re-adding unchanged tags.
    await db.promise().query('DELETE FROM Post_Tag WHERE post_id = ?', [id]);
    if (tags && tags.length > 0) {
      const tagPlaceholders = tags.map(() => '(?, ?)').join(',');
      const tagValues = [];
      for (const tagName of tags) {
        // Find or create tag
        let [tagRows] = await db.promise().query('SELECT tag_id FROM Tag WHERE name = ?', [tagName]);
        let tagId;
        if (tagRows.length > 0) {
          tagId = tagRows[0].tag_id;
        } else {
          const [newTag] = await db.promise().query('INSERT INTO Tag (name) VALUES (?)', [tagName]);
          tagId = newTag.insertId;
        }
        tagValues.push(id, tagId);
      }
      if (tagValues.length > 0) {
        await db.promise().query(`INSERT INTO Post_Tag (post_id, tag_id) VALUES ${tagPlaceholders}`, tagValues);
      }
    }
    
    // Fetch the updated post to return it
    // Similar to getPostById but simplified as we don't need comments here, just the post details for the list
    const [updatedPosts] = await db.promise().query(
      `SELECT p.post_id, p.title, p.content, p.status, p.created_at, u.user_id, u.username, 
       (SELECT CONVERT(u.profile_pic USING utf8) FROM User u WHERE u.user_id = p.user_id) as profile_pic,
       (SELECT COUNT(*) FROM Post_Interaction pi WHERE pi.post_id = p.post_id AND pi.interaction_type = 'like') as like_count
       FROM Post p JOIN User u ON p.user_id = u.user_id WHERE p.post_id = ?`,
      [id]
    );
    const updatedPostData = updatedPosts[0];
    
    const [currentTags] = await db.promise().query('SELECT t.name FROM Tag t JOIN Post_Tag pt ON t.tag_id = pt.tag_id WHERE pt.post_id = ?', [id]);
    updatedPostData.tags = currentTags.map(t => t.name);
    updatedPostData.user = { user_id: updatedPostData.user_id, username: updatedPostData.username, profile_pic: updatedPostData.profile_pic };
    updatedPostData.interactions = { likes: updatedPostData.like_count, views: 0, comments: 0 }; // Placeholder for views/comments as they are not updated here
    
    // Check if current user (editor) has liked this post to return consistent currentUserHasLiked
    const [likeStatus] = await db.promise().query(
      'SELECT 1 FROM Post_Interaction WHERE post_id = ? AND user_id = ? AND interaction_type = \'like\' LIMIT 1',
      [id, userId]
    );
    updatedPostData.currentUserHasLiked = likeStatus.length > 0;

    res.status(200).json({ message: 'Post updated successfully', post: updatedPostData });

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,       // Export new function
  interactWithPost,
  addComment,
  giveHonorToComment,
  updateComment,
  deleteComment,
  deletePost,       // Export new function
  updatePostStatus  // Export new function
}; 