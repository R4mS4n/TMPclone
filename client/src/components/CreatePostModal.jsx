import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Set base URL for API requests if not already set
if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = 'http://localhost:5000';
}

const CreatePostModal = ({ isOpen, onClose, onPostCreated, postToEdit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!postToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setTitle(postToEdit.title || '');
        setContent(postToEdit.content || '');
        setTags(postToEdit.tags ? postToEdit.tags.join(', ') : '');
      } else {
        setTitle('');
        setContent('');
        setTags('');
      }
      setError('');
    }
  }, [isOpen, postToEdit, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in');
        setIsSubmitting(false);
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      let response;
      if (isEditMode) {
        console.log('Updating post:', postToEdit.post_id, { title, content, tags: tagArray });
        response = await axios.put(`/api/posts/${postToEdit.post_id}`, {
          title,
          content,
          tags: tagArray
        }, config);
        console.log('Post updated successfully:', response.data);
      } else {
        console.log('Creating new post:', { title, content, tags: tagArray });
        response = await axios.post('/api/posts', {
          title,
          content,
          tags: tagArray
        }, config);
        console.log('Post created successfully:', response.data);
      }
      
      setTitle('');
      setContent('');
      setTags('');
      onClose();
      
      if (onPostCreated) {
        onPostCreated(response.data.post || response.data);
      }

    } catch (err) {
      console.error('API request failed:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl mx-4 p-6 rounded-lg shadow-lg z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="What's your question or discussion topic?"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="content" className="block text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[150px]"
              placeholder="Describe your question or topic in detail..."
              required
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label htmlFor="tags" className="block text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="javascript, react, css"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Update Post' : 'Create Post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal; 