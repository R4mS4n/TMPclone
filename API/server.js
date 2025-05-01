const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock data
const posts = [
  {
    post_id: 1,
    title: 'How to patch KDE on FreeBSD?',
    user: { username: 'Golanginya', profile_pic: null },
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consequat aliquet maecenas ut sit nulla',
    tags: ['golang', 'linux', 'freebsd'],
    interactions: { views: 125, likes: 15, comments: 155 }
  },
  {
    post_id: 2,
    title: 'Stuck in Challenge 11, How do i continue?',
    user: { username: 'Linuxoid', profile_pic: null },
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Bibendum vitae etiam lectus amet enim.',
    tags: ['java', 'javascript', 'wsl'],
    interactions: { views: 125, likes: 15, comments: 155 }
  },
  {
    post_id: 3,
    title: 'Do I need to use JavaScript in the courses?',
    user: { username: 'AizhanMaratovna', profile_pic: null },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    tags: ['javascript', 'courses'],
    interactions: { views: 88, likes: 10, comments: 42 }
  }
];

const comments = {
  1: [
    {
      comment_id: 1,
      user: { username: 'LinuxExpert', profile_pic: null },
      content: 'You should try using the ports system to rebuild KDE with the appropriate flags.',
      created_at: new Date(Date.now() - 3 * 60000).toISOString(),
      status: 'active',
      honor_count: 12
    },
    {
      comment_id: 2,
      user: { username: 'FreeBSDDev', profile_pic: null },
      content: 'Make sure you have the latest source code from the KDE repository before compiling.',
      created_at: new Date(Date.now() - 120 * 60000).toISOString(),
      status: 'active',
      honor_count: 8
    }
  ],
  2: [
    {
      comment_id: 3,
      user: { username: 'JavaDeveloper', profile_pic: null },
      content: 'Try resetting your progress for the specific challenge and start from the beginning.',
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'active',
      honor_count: 5
    }
  ],
  3: [
    {
      comment_id: 4,
      user: { username: 'JSTeacher', profile_pic: null },
      content: 'JavaScript is essential for most web development courses, but not all. Check the course requirements.',
      created_at: new Date(Date.now() - 200 * 60000).toISOString(),
      status: 'active',
      honor_count: 20
    }
  ]
};

// Routes
app.get('/api/posts', (req, res) => {
  const { status } = req.query;
  let filteredPosts = [...posts];
  
  if (status === 'hot') {
    filteredPosts.sort((a, b) => b.interactions.views + b.interactions.likes - (a.interactions.views + a.interactions.likes));
  } else if (status === 'top') {
    filteredPosts.sort((a, b) => b.interactions.likes - a.interactions.likes);
  } else if (status === 'closed') {
    // For now, just return an empty array for closed posts
    filteredPosts = [];
  }
  
  res.json(filteredPosts);
});

app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.post_id === parseInt(req.params.id));
  
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  
  res.json(post);
});

app.get('/api/posts/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id);
  const postComments = comments[postId] || [];
  
  res.json(postComments);
});

app.post('/api/posts', (req, res) => {
  const { title, content, tags } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }
  
  const newPost = {
    post_id: posts.length + 1,
    title,
    content,
    tags: tags || [],
    user: { username: 'CurrentUser', profile_pic: null },
    created_at: new Date().toISOString(),
    interactions: { views: 0, likes: 0, comments: 0 }
  };
  
  posts.unshift(newPost);
  
  res.status(201).json(newPost);
});

app.post('/api/posts/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id);
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }
  
  const post = posts.find(p => p.post_id === postId);
  
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  
  if (!comments[postId]) {
    comments[postId] = [];
  }
  
  const newComment = {
    comment_id: comments[postId].length + 1,
    user: { username: 'CurrentUser', profile_pic: null },
    content,
    created_at: new Date().toISOString(),
    status: 'active',
    honor_count: 0
  };
  
  comments[postId].push(newComment);
  post.interactions.comments += 1;
  
  res.status(201).json(newComment);
});

app.post('/api/comments/:id/honor', (req, res) => {
  const commentId = parseInt(req.params.id);
  let found = false;
  
  // Search for the comment in all post comments
  Object.keys(comments).forEach(postId => {
    const comment = comments[postId].find(c => c.comment_id === commentId);
    
    if (comment) {
      comment.honor_count += 1;
      found = true;
    }
  });
  
  if (!found) {
    return res.status(404).json({ message: 'Comment not found' });
  }
  
  res.status(200).json({ message: 'Honor given successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 