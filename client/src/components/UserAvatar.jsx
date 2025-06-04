import React, { useState, useEffect, memo } from 'react';

const UserAvatarComponent = ({ userId, className = '', size = 'md' }) => {
  console.log("uid:", userId);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Size classes mapping
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  useEffect(() => {
    const fetchProfilePic = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5000/api/users/profile-pic/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePic();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [userId]);

  if (loading) {
    return (
      <div className={`rounded-full bg-gray-200 animate-pulse ${sizeClasses[size]} ${className}`} />
    );
  }

  return (
    <div className={`rounded-full overflow-hidden ${sizeClasses[size]} ${className}`.trim()}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={`User ${userId} profile`}
          className="w-full h-full object-cover"
          onError={() => setImageUrl('')}
        />
      ) : (
        <span className={`text-gray-500 font-bold ${
          size === 'sm' ? 'text-xs' : 
          size === 'md' ? 'text-sm' :
          size === 'lg' ? 'text-lg' : 'text-xl'
        }`}>
          {(userId ? userId.toString().charAt(0).toUpperCase() : '?')}
        </span>

      )}
    </div>
  );
};

export default memo(UserAvatarComponent);