import React, { useState, useEffect } from 'react';

const MyProfilePicture = ({ className = '' }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfilePic = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/users/profile-pic', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        } else {
          console.error('Failed to fetch profile picture:', response.status);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePic();

    // Clean up object URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className={`w-32 h-32 rounded-full bg-gray-200 animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`w-32 h-32 rounded-full overflow-hidden ${className}`.trim()}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Profile" 
          className="w-full h-full object-cover"
          onError={() => setImageUrl('')}
        />
      ) : (
        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
          <span className="text-4xl text-gray-500 font-bold">
            {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      )}
    </div>
  );
};

export default MyProfilePicture;