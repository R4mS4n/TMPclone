import React, { useState, useRef } from 'react';
import MyProfilePicture from '../components/MyProfilePicture';
import { useNotification } from '../contexts/NotificationContext';

const UserSettings = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Basic validation
    if (!selectedFile.type.startsWith('image/')) {
      notifyError('Please select an image file');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      notifyError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      notifyError('Please select an image first');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      notifyError('You need to be logged in to upload a profile picture');
      window.location.href = '/login';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const response = await fetch('http://localhost:5000/api/users/upload-profile-pic', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // First check if the response is OK
      if (!response.ok) {
        // If unauthorized, clear token and redirect
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          notifyError('Session expired. Please login again.');
          window.location.href = '/login';
          return;
        }
        
        // Handle other errors
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      
      // Check if the server returned a new image URL
      if (data.profilePicUrl) {
        // Update the profile picture in the UI immediately
        setPreviewUrl(data.profilePicUrl);
      }
      
      notifySuccess('Profile picture updated successfully!');
      
      // Clear the file selection
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      notifyError(error.message || 'Failed to upload profile picture');
      
      // If it's a network error, don't clear the token
      if (error.name !== 'TypeError') { // TypeError usually means network error
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Profile Picture</h2>
      <div className="flex flex-col items-center gap-4">
        {/* Profile Picture Container - Consistent sizing */}
        <div 
          className="relative group cursor-pointer w-32 h-32" // Fixed dimensions here
          onClick={() => fileInputRef.current.click()}
        >
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MyProfilePicture className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          id="profilePicInput"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        
        {/* Upload button appears only when there's a preview */}
        {previewUrl ? (
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              className="btn btn-accent"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Confirm Upload'}
            </button>
            <button
              onClick={() => {
                setPreviewUrl(null);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="btn btn-error"
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current.click()}
            className="btn btn-primary"
          >
            Change Picture
          </button>
        )}
      </div>
    </div>
  );
};

export default UserSettings;