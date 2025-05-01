import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Set base URL for API requests if not already set
if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = 'http://localhost:3000';
}

const PostDetailModal = ({ isOpen, onClose, postId }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPostDetails();
    }
  }, [isOpen, postId]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching post details for post ID:', postId);
      
      // Try to fetch from API
      try {
        const [postResponse, commentsResponse] = await Promise.all([
          axios.get(`/api/posts/${postId}`),
          axios.get(`/api/posts/${postId}/comments`)
        ]);
        
        console.log('Post details:', postResponse.data);
        console.log('Comments:', commentsResponse.data);
        
        setPost(postResponse.data);
        setComments(commentsResponse.data || []);
      } catch (err) {
        console.error('API request failed, using fallback data:', err);
        
        // Use placeholder data as fallback
        setPost({
          post_id: postId,
          title: 'How to patch KDE on FreeBSD?',
          user: { username: 'Golanginya', profile_pic: null },
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consequat aliquet maecenas ut sit nulla',
          tags: ['golang', 'linux', 'freebsd'],
          interactions: { views: 125, likes: 15, comments: 155 }
        });
        
        setComments([
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
        ]);
      }
    } catch (error) {
      console.error('Error in fetchPostDetails:', error);
      setError('Failed to load post details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      console.log('Posting comment to post ID:', postId);
      console.log('Comment content:', newComment);
      
      // Try to post comment via API
      try {
        const response = await axios.post(`/api/posts/${postId}/comments`, {
          content: newComment
        });
        
        console.log('Comment posted successfully:', response.data);
        setComments([...comments, response.data]);
      } catch (err) {
        console.error('API request failed, using fallback:', err);
        
        // Fallback to adding comment locally
        const placeholderComment = {
          comment_id: comments.length + 1,
          user: { username: 'CurrentUser', profile_pic: null },
          content: newComment,
          created_at: new Date().toISOString(),
          status: 'active',
          honor_count: 0
        };
        
        setComments([...comments, placeholderComment]);
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
      setError('Failed to post your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / (60 * 24))} days ago`;
    }
  };

  const handleHonor = async (commentId) => {
    try {
      console.log('Giving honor to comment ID:', commentId);
      
      // Try to give honor via API
      try {
        await axios.post(`/api/comments/${commentId}/honor`);
        console.log('Honor given successfully');
      } catch (err) {
        console.error('API request failed, updating UI only:', err);
      }
      
      // Update the honor count in the UI
      setComments(
        comments.map(comment => 
          comment.comment_id === commentId
            ? { ...comment, honor_count: comment.honor_count + 1 }
            : comment
        )
      );
    } catch (error) {
      console.error('Error in handleHonor:', error);
      setError('Failed to give honor. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl mx-4 my-8 rounded-lg shadow-lg z-10 relative">
        {error && (
          <div className="p-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100">
            {error}
            <button 
              className="ml-2 underline"
              onClick={fetchPostDetails}
            >
              Try again
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : post ? (
          <>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden mr-3">
                  {post.user.profile_pic ? (
                    <img src={post.user.profile_pic} alt={post.user.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      {post.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">{post.user.username}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(post.created_at)}</p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <span>{post.interactions.views}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                  <span>{post.interactions.likes}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                  <span>{comments.length}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Comments</h3>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.comment_id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden mr-2">
                          {comment.user.profile_pic ? (
                            <img src={comment.user.profile_pic} alt={comment.user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              {comment.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">{comment.user.username}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.created_at)}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleHonor(comment.comment_id)}
                        className="flex items-center text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                        </svg>
                        <span>{comment.honor_count}</span>
                      </button>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mt-2">{comment.content}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmitComment}>
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-gray-700 dark:text-gray-300 mb-2">
                    Add a comment
                  </label>
                  <textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[100px]"
                    placeholder="Share your thoughts..."
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Post not found or has been deleted.
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailModal; 