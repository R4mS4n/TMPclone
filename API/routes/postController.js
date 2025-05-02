const db = require('../config/db');

// Obtener todos los posts con filtro por estado (new, hot, top, closed)
const getPosts = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        p.post_id, 
        p.title, 
        p.content, 
        p.status, 
        p.created_at,
        u.user_id,
        u.username,
        (SELECT CONVERT(u.profile_pic USING utf8) FROM User u WHERE u.user_id = p.user_id) as profile_pic,
        (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id) as comment_count,
        (SELECT COUNT(*) FROM Post_Interaction pi WHERE pi.post_id = p.post_id AND pi.interaction_type = 'view') as view_count,
        (SELECT COUNT(*) FROM Post_Interaction pi WHERE pi.post_id = p.post_id AND pi.interaction_type = 'like') as like_count
      FROM Post p
      JOIN User u ON p.user_id = u.user_id
    `;

    if (status && ['new', 'hot', 'top', 'closed'].includes(status)) {
      if (status === 'top') {
        // Ordenar por número de likes
        query += ` ORDER BY like_count DESC`;
      } else if (status === 'hot') {
        // Posts con más interacciones recientes
        query += ` WHERE p.status != 'closed' ORDER BY (like_count + comment_count) DESC, p.created_at DESC`;
      } else {
        // Filtrar por estado específico
        query += ` WHERE p.status = ?`;
      }
    } else {
      // Por defecto, ordenar por más recientes
      query += ` ORDER BY p.created_at DESC`;
    }

    // Limitar resultados
    query += ` LIMIT 50`;

    const [posts] = await db.promise().query(
      query,
      status && status !== 'top' && status !== 'hot' ? [status] : []
    );

    // Obtener las etiquetas para cada post
    for (const post of posts) {
      const [tags] = await db.promise().query(
        `SELECT t.name 
         FROM Tag t
         JOIN Post_Tag pt ON t.tag_id = pt.tag_id
         WHERE pt.post_id = ?`,
        [post.post_id]
      );
      
      post.tags = tags.map(tag => tag.name);
      
      // Formatear los datos para la respuesta
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
      
      // Eliminar propiedades redundantes
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
        (SELECT COUNT(*) FROM Comment c WHERE c.post_id = p.post_id) as comment_count,
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
    
    // Obtener los comentarios
    const [comments] = await db.promise().query(
      `SELECT 
        c.comment_id,
        c.content,
        c.created_at,
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
    
    // Formatear los comentarios
    const formattedComments = comments.map(comment => ({
      comment_id: comment.comment_id,
      content: comment.content,
      created_at: comment.created_at,
      status: comment.status,
      honor_count: comment.honor_count || 0,
      user: {
        user_id: comment.user_id,
        username: comment.username,
        profile_pic: comment.profile_pic
      }
    }));
    
    // Formatear el post
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
      comments: formattedComments
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
    const user_id = req.user.id; // Asumiendo que el middleware de autenticación agrega req.user
    
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
    const user_id = req.user.id; // Asumiendo que el middleware de autenticación agrega req.user
    
    if (!['like', 'view'].includes(type)) {
      return res.status(400).json({ message: 'Invalid interaction type' });
    }
    
    // Verificar si el post existe
    const [posts] = await db.promise().query(
      'SELECT * FROM Post WHERE post_id = ?',
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Para likes, verificar si el usuario ya dio like
    if (type === 'like') {
      const [existingLikes] = await db.promise().query(
        'SELECT * FROM Post_Interaction WHERE post_id = ? AND user_id = ? AND interaction_type = ?',
        [id, user_id, 'like']
      );
      
      if (existingLikes.length > 0) {
        // Si ya dio like, eliminarlo (toggle)
        await db.promise().query(
          'DELETE FROM Post_Interaction WHERE post_id = ? AND user_id = ? AND interaction_type = ?',
          [id, user_id, 'like']
        );
        return res.status(200).json({ message: 'Like removed' });
      }
    }
    
    // Registrar la interacción
    await db.promise().query(
      'INSERT INTO Post_Interaction (post_id, user_id, interaction_type) VALUES (?, ?, ?)',
      [id, user_id, type]
    );
    
    // Obtener el conteo actualizado
    const [interactions] = await db.promise().query(
      'SELECT COUNT(*) as count FROM Post_Interaction WHERE post_id = ? AND interaction_type = ?',
      [id, type]
    );
    
    res.status(200).json({ 
      message: `${type} registered successfully`,
      count: interactions[0].count
    });
  } catch (error) {
    console.error(`Error during ${req.params.type} interaction:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Agregar un comentario a un post
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id; // Asumiendo que el middleware de autenticación agrega req.user
    
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
    const user_id = req.user.id; // Asumiendo que el middleware de autenticación agrega req.user
    
    // Verificar si el comentario existe
    const [comments] = await db.promise().query(
      'SELECT * FROM Comment WHERE comment_id = ?',
      [commentId]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Verificar si el usuario ya dio honor a este comentario
    const [existingHonors] = await db.promise().query(
      'SELECT * FROM Honor WHERE comment_id = ? AND given_by_user_id = ?',
      [commentId, user_id]
    );
    
    if (existingHonors.length > 0) {
      // Si ya dio honor, eliminarlo (toggle)
      await db.promise().query(
        'DELETE FROM Honor WHERE comment_id = ? AND given_by_user_id = ?',
        [commentId, user_id]
      );
      
      // Actualizar los puntos de honor del usuario que recibió el honor
      await db.promise().query(
        `UPDATE User_Honor_Total 
         SET honor_points = honor_points - 1 
         WHERE user_id = ?`,
        [comments[0].user_id]
      );
      
      return res.status(200).json({ message: 'Honor removed' });
    }
    
    // Dar honor al comentario
    await db.promise().query(
      'INSERT INTO Honor (comment_id, given_by_user_id) VALUES (?, ?)',
      [commentId, user_id]
    );
    
    // Actualizar o crear el registro de honor total del usuario
    const [userHonorExists] = await db.promise().query(
      'SELECT * FROM User_Honor_Total WHERE user_id = ?',
      [comments[0].user_id]
    );
    
    if (userHonorExists.length > 0) {
      await db.promise().query(
        `UPDATE User_Honor_Total 
         SET honor_points = honor_points + 1 
         WHERE user_id = ?`,
        [comments[0].user_id]
      );
    } else {
      await db.promise().query(
        'INSERT INTO User_Honor_Total (user_id, honor_points) VALUES (?, 1)',
        [comments[0].user_id]
      );
    }
    
    // Obtener el conteo actualizado
    const [honors] = await db.promise().query(
      'SELECT COUNT(*) as count FROM Honor WHERE comment_id = ?',
      [commentId]
    );
    
    res.status(200).json({ 
      message: 'Honor given successfully',
      count: honors[0].count
    });
  } catch (error) {
    console.error('Error giving honor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  interactWithPost,
  addComment,
  giveHonorToComment
}; 