import { useState, useEffect } from 'react';
import CreatePostModal from '../components/CreatePostModal';
import PostDetailModal from '../components/PostDetailModal';
import ReportModal from '../components/ReportModal';
import { jwtDecode } from "jwt-decode";
import '../styles/blog.css';
import { useTheme } from '../contexts/ThemeContext';
import { formatTimeAgo } from '../utils/timeUtils';
import apiClient from '../utils/api';
import ProfilePicture from '../components/ProfilePicture';
import { AnimatePresence, motion } from 'framer-motion';

const Blog = () => {
  console.log('Blog component rendering');
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [timeRefresh, setTimeRefresh] = useState(0);
  const [activePostMenu, setActivePostMenu] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingTarget, setReportingTarget] = useState(null);
  const [showDeletePostConfirmModal, setShowDeletePostConfirmModal] = useState(false);
  const [postToDeleteId, setPostToDeleteId] = useState(null);
  const [postToEdit, setPostToEdit] = useState(null);
  
  useTheme();

  // Determine current user ID and roles from token
  let currentUserId = null;
  let currentUserIsAdmin = false; // Changed from currentUserRoles to a boolean
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      currentUserId = decodedToken.sub; 
      // Check the singular 'role' claim and assume role > 0 is admin
      // Adjust this logic if your admin role has a different specific value (e.g., role === 1, or role === 'admin_role_value')
      if (decodedToken.role && Number(decodedToken.role) > 0) { 
        currentUserIsAdmin = true;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      // Check if the error is due to token expiration
      if (error.name === 'InvalidTokenError' || (error.message && error.message.includes('expired'))) {
        setError('Token expired, please log in again.');
      } else {
        setError('Error decoding token. Please try logging in again.');
      }
      // It might be good to also clear the invalid token from localStorage here
      // localStorage.removeItem('authToken'); 
    }
  }

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('Fetching posts for tab:', activeTab);
        
        const params = new URLSearchParams();

        switch(activeTab) {
          case 'new':
            params.set('sort_by', 'created_at');
            break;
          case 'top':
            params.set('sort_by', 'likes');
            break;
          case 'hot':
            params.set('sort_by', 'comments'); // Changed from 'views' to 'comments'
            break;
          case 'closed':
            params.set('filter_status', 'closed');
            break;
          default:
            params.set('sort_by', 'created_at'); // Default to 'new'
        }

        const response = await apiClient.get('/posts', { params });
        
        console.log('Fetched posts (server-sorted):', response.data);
        setPosts(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    
    const refreshInterval = setInterval(() => {
      fetchPosts();
    }, 60000 * 5); 
    
    return () => {
      clearInterval(refreshInterval); 
    };
  }, [activeTab, token]); // Added token to dependencies as it's used in headers

  // Set up automatic refreshing of timestamps
  useEffect(() => {
    // Update timestamps every minute
    const timeInterval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, []);

  // Fetch honor leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await apiClient.get('/users/honor-leaderboard');
        console.log('Leaderboard data:', response.data);
        setLeaderboard(response.data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching honor leaderboard:', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();

    // Add event listener for honor updates
    const handleHonorUpdate = () => {
      console.log('Honor update detected, refreshing leaderboard');
      fetchLeaderboard();
    };

    window.addEventListener('honor-update', handleHonorUpdate);

    return () => {
      window.removeEventListener('honor-update', handleHonorUpdate);
    };
  }, []);

  // Event listener for post like changes from other components (e.g., modal)
  useEffect(() => {
    const handlePostLikeUpdateFromEvent = (event) => {
      if (event.detail && event.detail.postId) {
        console.log(`[BlogPage] Event post-like-changed received for post ${event.detail.postId}`, event.detail);
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.post_id === event.detail.postId 
              ? { 
                  ...p, 
                  currentUserHasLiked: event.detail.currentUserHasLiked,
                  interactions: { ...p.interactions, likes: event.detail.likes }
                }
              : p
          )
        );
      }
    };
    window.addEventListener('post-like-changed', handlePostLikeUpdateFromEvent);
    return () => {
      window.removeEventListener('post-like-changed', handlePostLikeUpdateFromEvent);
    };
  }, []); // Empty dependency array, runs once

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  console.log('Filtered posts:', filteredPosts);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const openPostDetail = async (postId) => {
    setSelectedPostId(postId);
    setIsPostDetailModalOpen(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Authentication required to track views');
        return;
      }
      
      await apiClient.post(`/posts/${postId}/view`);

    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  const handleLikePost = async (postId, e) => {
    e.stopPropagation(); // Prevent opening the post detail modal
    
    // Find the post to check its status
    const post = posts.find(p => p.post_id === postId);
    if (post?.status === 'closed') {
      setError('Cannot like closed posts');
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Authentication required to like posts');
        return;
      }
      
      await apiClient.post(`/posts/${postId}/like`);

      const wasLiked = post.currentUserHasLiked;
      const newLikesCount = wasLiked ? post.interactions.likes - 1 : post.interactions.likes + 1;

      // Update local state with new like count and status from API response
      setPosts(prevPosts =>
        prevPosts.map(p => 
          p.post_id === postId
            ? { 
                ...p, 
                currentUserHasLiked: !wasLiked,
                interactions: { 
                  ...p.interactions, 
                  likes: newLikesCount
                } 
              }
            : p
        )
      );
      setError(null);

      // Dispatch event so other components (like PostDetailModal) can sync
      window.dispatchEvent(new CustomEvent('post-like-changed', {
        detail: {
          postId: postId,
          likes: newLikesCount,
          currentUserHasLiked: !wasLiked,
        }
      }));

    } catch (err) {
      console.error('Error liking post:', err);
      setError(err.message || 'Failed to like the post. Please try again.');
    }
  };

  // Create a function to close the post detail modal and refresh posts
  const handleClosePostDetail = () => {
    setIsPostDetailModalOpen(false);
    setSelectedPostId(null);
    
    const fetchPostsOnClose = async () => {
      try {
        const params = new URLSearchParams();
        switch(activeTab) {
          case 'new': params.set('sort_by', 'created_at'); break;
          case 'top': params.set('sort_by', 'likes'); break;
          case 'hot': params.set('sort_by', 'comments'); break;
          case 'closed': params.set('filter_status', 'closed'); break;
          default: params.set('sort_by', 'created_at');
        }
        const response = await apiClient.get('/posts', { params });
        setPosts(response.data);
      } catch (err) {
        console.error('Error refetching posts on modal close:', err);
      }
    };
    
    fetchPostsOnClose();
  };

  // Get the first initial of a username for the avatar
  const getUserInitial = (username) => {
    return username && username.length > 0 ? username.charAt(0).toUpperCase() : '?';
  };

  // Render badge rank for leaderboard
  const renderRankBadge = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  // Render honor badge class based on rank
  const getHonorBadgeClass = (index) => {
    switch(index) {
      case 0:
        return "honor-badge honor-badge-gold";
      case 1: 
        return "honor-badge honor-badge-silver";
      case 2:
        return "honor-badge honor-badge-bronze";
      default:
        return "honor-badge honor-badge-default";
    }
  };

  const handleOpenReportModal = (type, id) => {
    setReportingTarget({ type, id });
    setIsReportModalOpen(true);
    setActivePostMenu(null); // Close three-dots menu if open
  };

  const submitReportToApi = async (targetType, targetId, reasonCategory, customReasonText) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User not authenticated for reporting.');
      }
      const payload = {
        target_type: targetType,
        target_id: targetId,
        reason_category: reasonCategory,
        custom_reason: customReasonText
      };
      
      await apiClient.post('/reports/create', payload);

      setIsReportModalOpen(false);
      setReportingTarget(null);
      
      console.log('Report submitted successfully');
      // Success message handled by ReportModal
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error; // Re-throw to be caught by ReportModal
    }
  };

  const handleDeletePost = async (postId) => {
    setPostToDeleteId(postId);
    setShowDeletePostConfirmModal(true);
    setActivePostMenu(null); // Close three-dots menu
  };

  const executeDeletePost = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !postToDeleteId) return;

      await apiClient.delete(`/posts/${postToDeleteId}`);

      setPosts(posts.filter(p => p.post_id !== postToDeleteId));
      setShowDeletePostConfirmModal(false);
      setPostToDeleteId(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Could not delete post.');
    }
  };

  const handleChangePostStatus = async (postId, newStatus) => {
    // Check user roles before allowing status change
    if (!currentUserIsAdmin) { // Using the boolean admin flag
      console.error("Permission denied: Only admins can change post status.");
      setError("You do not have permission to change post status.");
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User not authenticated for changing post status.');
      }
      
      await apiClient.put(`/posts/${postId}/status`, { status: newStatus });

      setPosts(posts.map(p => p.post_id === postId ? { ...p, status: newStatus } : p));
      setActivePostMenu(null); // Close menu after action
      
      if ((activeTab === 'closed' && newStatus !== 'closed') || (activeTab !== 'closed' && newStatus === 'closed')) {
        setPosts(posts.filter(p => p.post_id !== postId));
      }
      setError(null);
    } catch (err) {
      console.error(`Error updating post status to ${newStatus}:`, err);
      setError(err.message || `Could not update post status.`);
    }
  };

  const handleEditPost = (post) => {
    setPostToEdit(post);
    setIsCreateModalOpen(true);
    setActivePostMenu(null); // Close three-dots menu
  };

  return (
    <div className="blog-container container mx-auto p-4 max-w-6xl bg-base-300">
      <h1 className="text-2xl font-bold mb-6 text-base-content">Discussion Forum</h1>
      
      {/* Main content layout with flex */}
      <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
        {/* Main forum content - left column */}
        <div className="lg:w-2/3">
          <div className="flex mb-4 space-x-2">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-1 rounded-md ${activeTab === 'new' ? 'btn-primary text-primary-content' : 'bg-neutral text-neutral-content'}`}
            >
              <span className="flex items-center">
                <span className="mr-1 text-xs font-bold rounded-full bg-red-600 text-white px-1">●</span>
                New
              </span>
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`px-4 py-1 rounded-md ${activeTab === 'top' ? 'btn-primary text-primary-content' : 'bg-neutral text-neutral-content'}`}
            >
              <span className="flex items-center">
                <span className="mr-1">↑</span>
                Top
              </span>
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-4 py-1 rounded-md ${activeTab === 'hot' ? 'btn-primary text-primary-content' : 'bg-neutral text-neutral-content'}`}
            >
              <span className="flex items-center">
                <span className="mr-1">🔥</span>
                Hot
              </span>
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-4 py-1 rounded-md ${activeTab === 'closed' ? 'btn-primary text-primary-content' : 'bg-neutral text-neutral-content'}`}
            >
              <span className="flex items-center">
                <span className="mr-1">✓</span>
                Closed
              </span>
            </button>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search posts..."
              className="w-full h-12 input input-bordered focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-error text-error-content p-4 mb-4 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <div 
                    key={post.post_id} 
                    className="post-card card bg-base-100 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-base-200 rounded-md relative"
                    onClick={() => openPostDetail(post.post_id)}
                  >
                    <div className="absolute top-2 right-2 z-20">
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActivePostMenu(activePostMenu === post.post_id ? null : post.post_id); }}
                          className="p-1.5 rounded-full hover:bg-base-300 dark:hover:bg-base-200 transition-colors text-base-content/70 hover:text-base-content"
                          title="Post options"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {activePostMenu === post.post_id && (
                          <div 
                            className="absolute right-0 mt-2 w-48 bg-base-100 rounded-md shadow-xl py-1 z-30 dark:bg-base-300 border dark:border-base-200 ring-1 ring-black ring-opacity-5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {post.user_id !== currentUserId && (
                              <button
                                onClick={(e) => { handleOpenReportModal('post', post.post_id); }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 dark:hover:bg-base-100"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-2">
                                  <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" />
                                </svg>
                                Report Post
                              </button>
                            )}
                            {post.user_id === currentUserId && (
                              <button
                                onClick={(e) => { handleEditPost(post); }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 dark:hover:bg-base-100"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                </svg>
                                Edit Post
                              </button>
                            )}
                            {post.user_id === currentUserId && (
                              <button
                                onClick={(e) => { handleDeletePost(post.post_id); }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-base-200 dark:hover:bg-base-100"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Delete Post
                              </button>
                            )}
                            {/* Admin actions: Close/Reopen Post */}
                            {currentUserIsAdmin && (
                              <>
                                <div className="my-1 border-t border-base-200 dark:border-base-100"></div> {/* Separator */}
                                {post.status !== 'closed' ? (
                                  <button
                                    onClick={(e) => { handleChangePostStatus(post.post_id, 'closed'); }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-orange-500 hover:bg-base-200 dark:hover:bg-base-100"
                                  >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                       <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                     </svg>
                                    Close Post
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { handleChangePostStatus(post.post_id, 'active'); }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-green-500 hover:bg-base-200 dark:hover:bg-base-100"
                                  >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                       <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 5h.01M10 10a2 2 0 100 4 2 2 0 000-4z" />
                                     </svg>
                                    Reopen Post
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card-body p-4">
                      <div className="flex items-center mb-2">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-content overflow-hidden mr-3">
                              <ProfilePicture userId={post.user.user_id} username={post.user.username} className="w-full h-full object-cover" />
                            </div>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-semibold truncate">{post.user.username}</p>
                            <p className="text-sm text-base-content/70">{formatTimeAgo(post.created_at)}</p>
                          </div>
                        </div>
                      
                      <h2 className="text-xl font-bold text-base-content group-hover:text-primary transition-colors duration-200 mb-2">
                        {post.title}
                      </h2>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="badge badge-outline px-2 py-1 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex justify-between text-sm text-base-content opacity-70">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                          <span>{post.interactions.views}</span>
                        </div>
                        <div 
                          className={`flex items-center ${
                            post.status === 'closed' 
                              ? 'cursor-not-allowed text-gray-400' 
                              : 'cursor-pointer hover:text-primary transition-colors duration-200'
                          }`}
                          onClick={(e) => handleLikePost(post.post_id, e)}
                          title={post.status === 'closed' ? 'Cannot like closed posts' : 'Like/Unlike'}
                        >
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
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                          </svg>
                          <span>{post.interactions.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card bg-base-100 shadow-md p-8 text-center rounded-md">
                  <p className="text-base-content opacity-60 mb-4">
                    {activeTab === 'closed' ? 'No closed posts available.' : 'No posts found matching your search criteria.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsCreateModalOpen(true);
                    }}
                    className="btn btn-primary"
                  >
                    Create a new post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - right column */}
        <div className="lg:w-1/3 space-y-4">
          {/* Honor Leaderboard Box */}
          <div className="sidebar-box card bg-base-100 shadow-md rounded-md">
            <div className="card-body p-4">
              <h3 className="card-title text-base-content mb-4">Highest Honor Leaderboard</h3>
              
              {leaderboardLoading ? (
                <div className="flex justify-center py-4">
                  <div className="loading loading-spinner text-primary"></div>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((user, index) => (
                    <div key={user.user_id} className="flex items-center">
                      <div className={`${getHonorBadgeClass(index)} mr-2`}>
                        <ProfilePicture userId={user.user_id} username={user.username} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-base-content truncate block">{user.username}</span>
                      </div>
                      <span className="font-semibold text-base-content ml-2">{user.honor_points}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-base-content opacity-60">
                  No honor data available yet
                </div>
              )}
            </div>
          </div>

          {/* Must-read posts & Featured links Box */}
          <div className="sidebar-box card bg-base-100 shadow-md rounded-md">
            <div className="card-body p-4">
              <h3 className="card-title text-base-content mb-3">Must-read posts</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-error mr-2">•</span>
                  <span className="text-base-content">Please read rules before you start working on a platform</span>
                </li>
                <li className="flex items-start">
                  <span className="text-error mr-2">•</span>
                  <span className="text-base-content">Vision & Strategy of Anantaup</span>
                </li>
              </ul>

              <h3 className="card-title text-base-content mt-6 mb-3">Featured links</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-error mr-2">•</span>
                  <a href="#" className="text-base-content hover:text-primary">Anantaup source code on GitHub</a>
                </li>
                <li className="flex items-start">
                  <span className="text-error mr-2">•</span>
                  <a href="#" className="text-base-content hover:text-primary">Golang best practices</a>
                </li>
                <li className="flex items-start">
                  <span className="text-error mr-2">•</span>
                  <a href="#" className="text-base-content hover:text-primary">Main Schedi dashboard</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Floating action button to create new post */}
      <button 
        onClick={() => setIsCreateModalOpen(true)}
        className="btn btn-primary btn-circle fixed bottom-8 right-8 shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      </button>

      {/* Create Post Modal (also used for editing) */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setPostToEdit(null); // Clear postToEdit when modal closes
        }}
        onPostCreated={handlePostCreated} // This will also be used for post updated
        postToEdit={postToEdit} // Pass the post to edit
      />

      {/* Post Detail Modal */}
      {isPostDetailModalOpen && (
        <PostDetailModal 
          isOpen={isPostDetailModalOpen} 
          onClose={handleClosePostDetail} 
          postId={selectedPostId}
          handleOpenReportModal={handleOpenReportModal}
        />
      )}

      {/* Report Modal - now shared between Blog and PostDetailModal */}
      {isReportModalOpen && (
        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType={reportingTarget?.type}
          targetId={reportingTarget?.id}
          onSubmitReport={submitReportToApi} 
        />
      )}

      {/* Delete Post Confirmation Modal */}
      {showDeletePostConfirmModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Post Deletion</h3>
            <p className="py-4">Are you sure you want to delete this post? This will also delete all associated comments and interactions. This action cannot be undone.</p>
            <div className="modal-action">
              <button onClick={() => setShowDeletePostConfirmModal(false)} className="btn">Cancel</button>
              <button onClick={executeDeletePost} className="btn btn-error">Delete Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;