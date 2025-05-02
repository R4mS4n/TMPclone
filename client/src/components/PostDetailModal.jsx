import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Set base URL for API requests if not already set
if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = 'http://localhost:5000';
}

const PostDetailModal = ({ isOpen, onClose, postId }) => {
  const [post, setPost] = useState(null);
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
      
      // Obtener post y comentarios
      try {
        const response = await axios.get(`/api/posts/${postId}`);
        
        console.log('Post details:', response.data);
        
        setPost(response.data);
      } catch (err) {
        console.error('API request failed:', err);
        setError('Failed to load post details. Please try again later.');
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
      
      // Obtener token de autenticación del localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to post a comment');
        setSubmitting(false);
        return;
      }
      
      // Configurar el encabezado de autorización
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Try to post comment via API
      try {
        const response = await axios.post(`/api/posts/${postId}/comments`, {
          content: newComment
        }, config);
        
        console.log('Comment posted successfully:', response.data);
        
        // Actualizar el post con el nuevo comentario
        setPost({
          ...post,
          comments: [...post.comments, response.data],
          interactions: {
            ...post.interactions,
            comments: post.interactions.comments + 1
          }
        });
        
        setNewComment('');
      } catch (err) {
        console.error('API request failed:', err);
        
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(err.response?.data?.message || 'Failed to post your comment. Please try again.');
        }
      }
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
      
      // Obtener token de autenticación del localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to give honor');
        return;
      }
      
      // Configurar el encabezado de autorización
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Try to give honor via API
      try {
        await axios.post(`/api/posts/comments/${commentId}/honor`, {}, config);
        console.log('Honor given successfully');
        
        // Actualizar el honor count en la UI
        setPost({
          ...post,
          comments: post.comments.map(comment => 
            comment.comment_id === commentId
              ? { ...comment, honor_count: comment.honor_count + 1 }
              : comment
          )
        });
      } catch (err) {
        console.error('API request failed:', err);
        
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(err.response?.data?.message || 'Failed to give honor. Please try again.');
        }
      }
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
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center mr-3 overflow-hidden">
                    {post.user.profile_pic ? (
                      <img src={post.user.profile_pic} alt={post.user.username} className="w-full h-full object-cover" />
                    ) : (
                      post.user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{post.user.username}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(post.created_at)}</p>
                </div>
              </div>
              
              <p className="text-gray-800 dark:text-gray-200 mb-6">{post.content}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags && post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex text-sm text-gray-500 dark:text-gray-400 space-x-6">
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
                  <span>{post.interactions.comments}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {post.comments && post.comments.length} Comment{post.comments && post.comments.length !== 1 ? 's' : ''}
              </h3>
              
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="mb-4">
                  <textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
              
              <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                {post.comments && post.comments.map((comment) => (
                  <div key={comment.comment_id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-start mb-2">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center mr-3 overflow-hidden">
                          {comment.user.profile_pic ? (
                            <img src={comment.user.profile_pic} alt={comment.user.username} className="w-full h-full object-cover" />
                          ) : (
                            comment.user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900 dark:text-white">{comment.user.username}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.created_at)}</p>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 mt-1">{comment.content}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pl-12">
                      <button
                        onClick={() => handleHonor(comment.comment_id)}
                        className="text-sm flex items-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Give Honor
                      </button>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {comment.honor_count} Honor
                      </span>
                    </div>
                  </div>
                ))}
                
                {post.comments && post.comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
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