import React, { useState, useEffect, useRef } from 'react';
import { formatTimeAgo } from '../utils/timeUtils';
import { jwtDecode } from "jwt-decode";
import ProfilePicture from './ProfilePicture';

const API_BASE_URL = 'http://localhost:5000';

const PostDetailModal = ({ isOpen, onClose, postId, handleOpenReportModal }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeRefresh, setTimeRefresh] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState(null);
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);
  const currentOpenPostIdRef = useRef(null); // Ref to store current postId for the event listener

  useEffect(() => {
    if (isOpen && postId) {
      currentOpenPostIdRef.current = postId; // Update ref when postId changes
      fetchPostDetails();
      
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          if (decodedToken) {
            let userIdFromToken = null;
            if (decodedToken.id) {
              userIdFromToken = decodedToken.id;
            } else if (decodedToken.sub) { // Check for 'sub' claim
              userIdFromToken = decodedToken.sub;
            }
            
            if (userIdFromToken !== null) {
              const numericUserId = parseInt(userIdFromToken, 10);
              if (!isNaN(numericUserId)) {
                setCurrentUserId(numericUserId);
              } else {
                console.error("User ID from token is not a valid number:", userIdFromToken);
                setCurrentUserId(null); 
              }
            } else {
              setCurrentUserId(null);
            }
          } else {
            setCurrentUserId(null);
          }
        } catch (error) {
          console.error("Error decoding token in PostDetailModal:", error);
          if (error.name === 'InvalidTokenError' || (error.message && error.message.includes('expired'))) {
            setError('Token expired, please log in again.');
          } else {
            setError('Error decoding token. Please try logging in again.');
          }
          setCurrentUserId(null);
        }
      } else {
        setCurrentUserId(null);
      }
      
      // Set up periodic data refresh while modal is open
      const refreshDataInterval = setInterval(() => {
        fetchPostDetails();
      }, 60000 * 5); // Refresh post data every 5 minutes
      
      // Event listener for post like changes
      const handlePostLikeChange = (event) => {
        // Use the ref to get the current post ID for comparison
        if (event.detail && event.detail.postId === currentOpenPostIdRef.current) {
          console.log('[PostDetailModal] Event post-like-changed received:', event.detail);
          setPost(prevPost => {
            if (!prevPost || prevPost.post_id !== event.detail.postId) {
              console.log('[PostDetailModal] Event listener: prevPost mismatch, not updating.');
              return prevPost; 
            }
            console.log('[PostDetailModal] Event listener: Updating post state from event.');
            return {
              ...prevPost,
              currentUserHasLiked: event.detail.currentUserHasLiked,
              interactions: {
                ...prevPost.interactions,
                likes: event.detail.likes,
              },
            };
          });
        }
      };
      window.addEventListener('post-like-changed', handlePostLikeChange);
      
      return () => {
        clearInterval(refreshDataInterval);
        window.removeEventListener('post-like-changed', handlePostLikeChange);
        currentOpenPostIdRef.current = null; // Clear ref on cleanup
      };
    }
  }, [isOpen, postId]); // Removed 'post' from dependency array, rely on ref for listener

  // Set up automatic refreshing of timestamps
  useEffect(() => {
    let timeInterval;
    
    if (isOpen) {
      // Update timestamps every minute
      timeInterval = setInterval(() => {
        setTimeRefresh(prev => prev + 1);
      }, 60000);
    }
    
    return () => {
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    };
  }, [isOpen]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching post details for post ID:', postId);
      
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch post details');
      }
      const data = await response.json();
      console.log('[PostDetailModal] Fetched post details:', data.title, 'currentUserHasLiked:', data.currentUserHasLiked, 'Likes:', data.interactions?.likes);
      setPost(data);
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
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to post a comment');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }

      const data = await response.json();
      
      // Update the post with the new comment
      setPost({
        ...post,
        comments: [...post.comments, data],
        interactions: {
          ...post.interactions,
          comments: post.interactions.comments + 1
        }
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
      setError(error.message || 'Failed to post your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHonor = async (commentId, commentUserId) => {
    console.log('handleHonor called for commentId:', commentId, 'by user:', currentUserId, 'for user:', commentUserId );
    try {
      // Check if post is closed
      if (post.status === 'closed') {
        setError('Cannot give honor to comments in closed posts');
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to give honor');
        return;
      }
      
      // Prevent honoring own comment
      // Ensure commentUserId is a number for comparison, if it's not already
      const numericCommentUserId = typeof commentUserId === 'string' ? parseInt(commentUserId, 10) : commentUserId;

      if (currentUserId !== null && numericCommentUserId === currentUserId) {
        setError('You cannot honor your own comment.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/posts/comments/${commentId}/honor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to give honor');
      }

      const data = await response.json();
      
      // Check if honor was added or removed
      const isHonorRemoved = data.message === 'Honor removed';
      
      // Update the honor count and status in the UI
      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.map(comment => 
          comment.comment_id === commentId
            ? { 
                ...comment, 
                honor_count: data.count,
                currentUserHasHonored: data.currentUserHasHonored
              }
            : comment
        )
      }));
      
      // Refresh the honor leaderboard
      window.dispatchEvent(new CustomEvent('honor-update'));
      
    } catch (error) {
      console.error('Error in handleHonor:', error);
      setError(error.message || 'Failed to give honor. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentToDeleteId(commentId);
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteComment = async () => {
    if (!commentToDeleteId) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required to delete comments.');
        setShowDeleteConfirmModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/posts/comments/${commentToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }

      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.map(c => 
          c.comment_id === commentToDeleteId 
            ? { ...c, content: '[comment deleted]', status: 'deleted', updated_at: new Date().toISOString() } 
            : c
        ),
      }));
      setError(null);
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.message || 'Could not delete comment. Please try again.');
    } finally {
      setShowDeleteConfirmModal(false);
      setCommentToDeleteId(null);
    }
  };
  
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.comment_id);
    setEditingCommentContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editingCommentContent.trim()) {
      setError("Comment can't be empty.");
      return;
    }
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required to edit comments.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/posts/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editingCommentContent }),
      });

      if (!response.ok) {
        // Try to get error message from JSON response, otherwise log raw text
        let errorResponseMessage = 'Failed to update comment';
        try {
          const errorData = await response.json();
          errorResponseMessage = errorData.message || errorResponseMessage;
        } catch (jsonError) {
          // If response is not JSON, log the raw text to see what it is (e.g., HTML error page)
          const rawResponseText = await response.text();
          console.error('Server returned non-JSON response:', rawResponseText);
          errorResponseMessage = `Server error: Received non-JSON response. Check console for details. Status: ${response.status}`;
        }
        throw new Error(errorResponseMessage);
      }
      const updatedComment = await response.json();
      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.map(c => 
          c.comment_id === commentId ? { ...updatedComment, user: c.user } : c
        ),
      }));
      setEditingCommentId(null);
      setEditingCommentContent('');
      setError(null);
    } catch (err) {
      console.error('Error saving comment edit:', err);
      setError(err.message || 'Could not save comment. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleLikeUnlikePost = async () => {
    if (!post || !post.post_id) return;
    if (post.status === 'closed') {
      setError('Cannot interact with closed posts.');
      return;
    }
    console.log(`[PostDetailModal] handleLikeUnlikePost called for post ${post.post_id}. Current state: liked=${post.currentUserHasLiked}, likes=${post.interactions.likes}`);

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You must be logged in to like posts.');
      return;
    }

    // Optimistic update (optional, but good for UX)
    const originalLikedStatus = post.currentUserHasLiked;
    const originalLikeCount = post.interactions.likes;

    const newOptimisticLikedStatus = !originalLikedStatus;
    const newOptimisticLikeCount = originalLikedStatus ? originalLikeCount - 1 : originalLikeCount + 1;
    console.log(`[PostDetailModal] Optimistic update: newLikedState=${newOptimisticLikedStatus}, newLikeCount=${newOptimisticLikeCount}`);

    setPost(prevPost => ({
      ...prevPost,
      currentUserHasLiked: newOptimisticLikedStatus,
      interactions: {
        ...prevPost.interactions,
        likes: newOptimisticLikeCount,
      },
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post.post_id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', // Though not strictly needed for this POST if no body
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update like status');
      }

      const data = await response.json();
      console.log('[PostDetailModal] Server response for like/unlike:', data);
      // Update with confirmed data from server
      setPost(prevPost => {
        console.log('[PostDetailModal] Updating post state from server response.');
        return {
          ...prevPost,
          currentUserHasLiked: data.currentUserHasLiked,
          interactions: {
            ...prevPost.interactions,
            likes: data.count,
          },
        };
      });
      setError(null);

      // Dispatch event so other components can sync
      window.dispatchEvent(new CustomEvent('post-like-changed', {
        detail: {
          postId: post.post_id,
          likes: data.count,
          currentUserHasLiked: data.currentUserHasLiked,
        }
      }));

    } catch (err) {
      console.error('Error liking/unliking post:', err);
      setError(err.message || 'Could not update like status. Please try again.');
      // Rollback optimistic update on error
      console.log('[PostDetailModal] Error in like/unlike. Rolling back optimistic update.');
      setPost(prevPost => ({
        ...prevPost,
        currentUserHasLiked: originalLikedStatus,
        interactions: {
          ...prevPost.interactions,
          likes: originalLikeCount,
        },
      }));
    }
  };

  // Render the comment section based on post status
  const renderCommentSection = () => {
    if (post.status === 'closed') {
      return (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
          This post is closed. New comments are not allowed.
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="mb-4">
          <textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-3 border border-base-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-base-200 text-base-content placeholder-base-content/60"
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
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-base-100 text-base-content w-full max-w-4xl mx-4 my-8 rounded-lg shadow-lg z-10 relative flex flex-col max-h-[90vh]">
        {error && (
          <div className="p-4 bg-error text-error-content">
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
          <div className="flex-1 overflow-y-auto pr-4">
            <div className="p-6 border-b border-base-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-base-content">{post.title}</h2>
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
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <ProfilePicture userId={post?.user?.user_id} username={post?.user?.username} className="w-12 h-12" />
                  </div>
                </div>
                <div className="flex-grow ml-4">
                  <div className="flex items-center">
                    <h3 className="font-medium text-base-content">{post.user.username}</h3>
                    <p className="text-sm text-base-content/70">{formatTimeAgo(post.created_at)}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-base-content mb-6">{post.content}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags && post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-base-200 text-base-content px-2 py-1 rounded-md text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex text-sm text-base-content/70 space-x-6">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <span>{post.interactions.views}</span>
                </div>
                <div className="flex items-center">
                  <button onClick={handleLikeUnlikePost} disabled={post.status === 'closed'} className={`flex items-center text-base-content/70 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed`}>
                    <svg 
                      className={`w-4 h-4 mr-1 ${post.currentUserHasLiked ? 'text-red-500' : ''}`}
                      fill={post.currentUserHasLiked ? 'currentColor' : 'none'} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                    <span>{post.interactions.likes}</span>
                  </button>
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
              <h3 className="text-lg font-bold text-base-content mb-4">
                {post.comments && post.comments.length} Comment{post.comments && post.comments.length !== 1 ? 's' : ''}
              </h3>
              
              {renderCommentSection()}
              
              <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                {post.comments && post.comments.map((comment) => {
                  // Ensure comment.user.user_id is a number for comparison
                  const numericCommentUserId = typeof comment.user.user_id === 'string' 
                                              ? parseInt(comment.user.user_id, 10) 
                                              : comment.user.user_id;
                  const isOwnComment = currentUserId !== null && numericCommentUserId === currentUserId;
                  return (
                  <div key={comment.comment_id} className="border-b border-base-200 pb-4">
                    <div className="flex items-start mb-2">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <ProfilePicture userId={comment?.user?.user_id} username={comment?.user?.username} className="w-10 h-10" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-base-content">{comment.user.username}</h4>
                            <p className="text-xs text-base-content/70">
                              {formatTimeAgo(comment.created_at)}
                              {comment.updated_at && comment.created_at !== comment.updated_at && (
                                <span className="italic text-xs"> (edited)</span>
                              )}
                            </p>
                          </div>
                          {comment.status !== 'deleted' && (
                            <div className="flex items-center space-x-1 relative">
                              {!isOwnComment && (
                                <button 
                                  onClick={() => handleOpenReportModal('comment', comment.comment_id)}
                                  title="Report Comment"
                                  className="p-1 rounded-full hover:bg-base-300 dark:hover:bg-base-200 text-gray-500 dark:text-gray-400 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                              {isOwnComment && (
                                <div className="relative">
                                  <button 
                                    onClick={() => setActiveCommentMenu(activeCommentMenu === comment.comment_id ? null : comment.comment_id)}
                                    className="p-1 rounded-full hover:bg-base-300 dark:hover:bg-base-200 text-gray-500 dark:text-gray-400 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>
                                  {activeCommentMenu === comment.comment_id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-base-100 rounded-md shadow-lg py-1 z-20 dark:bg-base-300 border dark:border-base-200">
                                      <button
                                        onClick={() => { handleEditComment(comment); setActiveCommentMenu(null); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 dark:hover:bg-base-100"
                                      >
                                        Edit Comment
                                      </button>
                                      <button
                                        onClick={() => { handleDeleteComment(comment.comment_id); setActiveCommentMenu(null); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-base-200 dark:hover:bg-base-100"
                                      >
                                        Delete Comment
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.comment_id ? (
                          <div>
                            <textarea 
                              value={editingCommentContent}
                              onChange={(e) => setEditingCommentContent(e.target.value)}
                              className="w-full p-2 border border-base-300 rounded-md mt-1 bg-base-200 text-base-content"
                              rows="3"
                            />
                            <div className="flex justify-end space-x-2 mt-1">
                              <button onClick={() => handleSaveEdit(comment.comment_id)} className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Save</button>
                              <button onClick={handleCancelEdit} className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-base-content mt-1 ${comment.status === 'deleted' ? 'italic text-base-content/60' : ''}`}>{comment.content}</p>
                        )}
                      </div>
                    </div>
                    
                    {comment.status !== 'deleted' && (
                    <div className="flex justify-between items-center pl-12 mt-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleHonor(comment.comment_id, comment.user.user_id)}
                          disabled={post.status === 'closed' || isOwnComment || comment.status === 'deleted'}
                          className={`text-sm flex items-center ${
                            post.status === 'closed' || isOwnComment || comment.status === 'deleted'
                              ? 'text-gray-400 cursor-not-allowed'
                              : comment.currentUserHasHonored
                                ? 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                                : 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                          }`}
                        >
                          <svg className={`w-4 h-4 mr-1 ${comment.currentUserHasHonored ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          {isOwnComment 
                            ? 'Cannot Honor Own Comment' 
                            : post.status === 'closed' 
                              ? 'Honor Disabled' 
                              : comment.currentUserHasHonored 
                                ? 'Revoke Honor'
                                : 'Give Honor'
                          }
                        </button>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-base-content/70 mr-4">
                          {typeof comment.honor_count === 'number' ? comment.honor_count : 0} Honor
                        </span>
                      </div>
                    </div>
                    )}
                  </div>
                );
              })}
                
                {post.comments && post.comments.length === 0 && (
                  <div className="text-center py-8 text-base-content/70">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-base-content/70">
            Post not found or has been deleted.
          </div>
        )}
      </div>

      {/* DaisyUI Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Deletion</h3>
            <p className="py-4">Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div className="modal-action">
              <button onClick={() => setShowDeleteConfirmModal(false)} className="btn">Cancel</button>
              <button onClick={executeDeleteComment} className="btn btn-error">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetailModal; 