import { useState, useEffect } from 'react';
import apiClient from '../utils/api';

const ProfilePicture = ({ userId, username, className }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchProfilePic = async () => {
      try {
        const response = await apiClient.get(`/users/profile-pic/${userId}`, {
          responseType: 'blob',
        });
        
        if (response.status === 200) {
          const url = URL.createObjectURL(response.data);
          setImgSrc(url);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      }
    };

    fetchProfilePic();
  }, [userId]);

  const getUserInitial = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };

  if (error || !imgSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-300 rounded-full ${className}`}>
        <span className="text-gray-600 font-bold">{getUserInitial(username)}</span>
      </div>
    );
  }

  return <img src={imgSrc} alt={`${username}'s profile`} className={`rounded-full ${className}`} />;
};

export default ProfilePicture; 