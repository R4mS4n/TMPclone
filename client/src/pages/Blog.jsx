import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import CreatePostModal from '../components/CreatePostModal';
import PostDetailModal from '../components/PostDetailModal';
import '../styles/blog.css';
import { useTheme } from '../contexts/ThemeContext';

// Set base URL for API requests
axios.defaults.baseURL = 'http://localhost:3000';

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
  const { theme, isDark } = useTheme();

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('Fetching posts with status:', activeTab);
        const response = await axios.get('/api/posts', {
          params: { status: activeTab }
        });
        console.log('API response:', response.data);
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
  }, [activeTab]);

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  console.log('Filtered posts:', filteredPosts);

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

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const openPostDetail = (postId) => {
    setSelectedPostId(postId);
    setIsPostDetailModalOpen(true);
    
    // Increment view count (would normally be handled by the API)
    setPosts(
      posts.map(post => 
        post.post_id === postId
          ? { 
              ...post, 
              interactions: { 
                ...post.interactions, 
                views: post.interactions.views + 1 
              } 
            }
          : post
      )
    );
  };

  const handleLikePost = async (postId, e) => {
    e.stopPropagation(); // Prevent opening the post detail modal
    
    try {
      // Make an API call to like the post
      await axios.post(`/api/posts/${postId}/like`);
      
      // Update local state
      setPosts(
        posts.map(post => 
          post.post_id === postId
            ? { 
                ...post, 
                interactions: { 
                  ...post.interactions, 
                  likes: post.interactions.likes + 1 
                } 
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
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
                            <p className="text-sm text-base-content opacity-60">{formatTimeAgo(post.created_at)}</p>
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
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="text-yellow-500 mr-2 w-6 text-center">🏆</div>
                  <div className="honor-badge honor-badge-gold mr-2">P</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-base-content truncate block">Paul C. Romes</span>
                  </div>
                  <span className="font-semibold text-base-content ml-2">5075</span>
                </div>
                
                <div className="flex items-center">
                  <div className="text-gray-400 mr-2 w-6 text-center">🥈</div>
                  <div className="honor-badge honor-badge-silver mr-2">M</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-base-content truncate block">Michael K. Ch.</span>
                  </div>
                  <span className="font-semibold text-base-content ml-2">3500</span>
                </div>
                
                <div className="flex items-center">
                  <div className="text-amber-700 mr-2 w-6 text-center">🥉</div>
                  <div className="honor-badge honor-badge-bronze mr-2">J</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-base-content truncate block">Jennifer A. J.</span>
                  </div>
                  <span className="font-semibold text-base-content ml-2">1100</span>
                </div>
                
                <div className="flex items-center">
                  <div className="text-gray-300 mr-2 w-6 text-center">4</div>
                  <div className="honor-badge honor-badge-default mr-2">J</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-base-content truncate block">Jeremy Fritz...</span>
                  </div>
                  <span className="font-semibold text-base-content ml-2">996</span>
                </div>
              </div>
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
        onClose={() => setIsPostDetailModalOpen(false)}
        postId={selectedPostId}
      />
    </div>
  );
};

export default Blog;