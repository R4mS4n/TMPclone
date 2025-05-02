import { useState, useEffect } from 'react';
import CreatePostModal from '../components/CreatePostModal';
import PostDetailModal from '../components/PostDetailModal';
import '../styles/blog.css';
import { useTheme } from '../contexts/ThemeContext';
import { formatTimeAgo } from '../utils/timeUtils';

const API_BASE_URL = 'http://localhost:5000';

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
  
  useTheme();

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('Fetching posts with status:', activeTab);
        const response = await fetch(`${API_BASE_URL}/api/posts?status=${activeTab}`);
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        console.log('API response:', data);
        setPosts(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    
    // Set up periodic data refresh
    const refreshInterval = setInterval(() => {
      fetchPosts();
    }, 60000 * 5); // Refresh every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [activeTab]);

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
        const response = await fetch(`${API_BASE_URL}/api/user/honor-leaderboard`);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const data = await response.json();
        console.log('Leaderboard data:', data);
        setLeaderboard(data.leaderboard || []);
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
      
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to record view');
      }
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  const handleLikePost = async (postId, e) => {
    e.stopPropagation(); // Prevent opening the post detail modal
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Authentication required to like posts');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();
      
      // Check if like was added or removed based on response
      const isLikeRemoved = data.message === 'Like removed';
      
      // Update local state
      setPosts(
        posts.map(post => 
          post.post_id === postId
            ? { 
                ...post, 
                interactions: { 
                  ...post.interactions, 
                  likes: isLikeRemoved 
                    ? post.interactions.likes - 1 
                    : post.interactions.likes + 1 
                } 
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Create a function to close the post detail modal and refresh posts
  const handleClosePostDetail = () => {
    setIsPostDetailModalOpen(false);
    
    // Refresh the posts to get updated view counts
    const fetchPosts = async () => {
      try {
        console.log('Fetching posts with status:', activeTab);
        const response = await fetch(`${API_BASE_URL}/api/posts?status=${activeTab}`);
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };
    
    fetchPosts();
  };

  // Get the first initial of a username for the avatar
  const getUserInitial = (username) => {
    return username && username.length > 0 ? username.charAt(0).toUpperCase() : '?';
  };

  // Render badge rank for leaderboard
  const renderRankBadge = (index) => {
    switch(index) {
      case 0:
        return <div className="text-yellow-500 mr-2 w-6 text-center">🏆</div>;
      case 1:
        return <div className="text-gray-400 mr-2 w-6 text-center">🥈</div>;
      case 2:
        return <div className="text-amber-700 mr-2 w-6 text-center">🥉</div>;
      default:
        return <div className="text-gray-300 mr-2 w-6 text-center">{index + 1}</div>;
    }
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
              className="w-full p-2 input input-bordered focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="post-card card bg-base-100 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-base-200"
                    onClick={() => openPostDetail(post.post_id)}
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-content overflow-hidden mr-3">
                              {post.user.profile_pic ? (
                                <img src={post.user.profile_pic} alt={post.user.username} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary-content">
                                  {post.user.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-base-content">{post.user.username}</h3>
                            <span>{formatTimeAgo(post.created_at)}</span>
                          </div>
                        </div>
                        <button 
                          className="btn btn-ghost btn-circle btn-sm"
                          onClick={(e) => e.stopPropagation()} // Prevent opening the post detail modal
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="mb-3">
                        <h2 className="post-title text-xl font-semibold text-base-content mb-2">{post.title}</h2>
                        <p className="post-content text-base-content opacity-80">{post.content}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="badge badge-outline px-2 py-1 text-xs"
                            onClick={(e) => e.stopPropagation()} // Prevent opening the post detail modal
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
                          className="flex items-center cursor-pointer hover:text-primary transition-colors duration-200"
                          onClick={(e) => handleLikePost(post.post_id, e)}
                        >
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
                  </div>
                ))
              ) : (
                <div className="card bg-base-100 shadow-md p-8 text-center">
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
          <div className="sidebar-box card bg-base-100 shadow-md">
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
                      {renderRankBadge(index)}
                      <div className={`${getHonorBadgeClass(index)} mr-2`}>
                        {user.profile_pic ? (
                          <img src={user.profile_pic} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          getUserInitial(user.username)
                        )}
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
          <div className="sidebar-box card bg-base-100 shadow-md">
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

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={isPostDetailModalOpen}
        onClose={handleClosePostDetail}
        postId={selectedPostId}
      />
    </div>
  );
};

export default Blog;