import React, { useState, useRef } from 'react';
import MyProfilePicture from '../components/MyProfilePicture';
import { useNotification } from '../contexts/NotificationContext';
import apiClient from '../utils/api';

const UserSettings = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      notifyError('Please select an image file');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      notifyError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);

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

    setIsUploading(true);
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const response = await apiClient.post('/users/upload-profile-pic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.profilePicUrl) {
        setPreviewUrl(response.data.profilePicUrl);
      }

      notifySuccess('Profile picture updated successfully!');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      notifyError(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setIsChangingUsername(true);

    try {
      await apiClient.put('/users/change-username', { newUsername });
      notifySuccess('Username updated successfully!');
      setNewUsername('');
      window.location.reload();
    } catch (error) {
      console.error('Username change error:', error);
      notifyError(error.response?.data?.error || 'Failed to update username');
    } finally {
      setIsChangingUsername(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      notifyError("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      notifyError("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      await apiClient.put('/users/change-password', { currentPassword, newPassword });

      notifySuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      notifyError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      notifyError('Please enter your password');
      return;
    }

    setIsDeleting(true);

    try {
      await apiClient.delete('/users/delete-account', {
        data: { password: deletePassword },
      });
      localStorage.removeItem('authToken');
      notifySuccess('Your account has been deleted');
      window.location.href = '/login';
    } catch (error) {
      console.error('Account deletion error:', error);
      notifyError(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-base-100">
      <div className="w-full max-w-4xl space-y-12">
        {/* Profile Picture */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Profile Picture</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer w-32 h-32" onClick={() => fileInputRef.current.click()}>
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MyProfilePicture className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <input type="file" id="profilePicInput" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            {previewUrl ? (
              <div className="flex gap-2">
                <button onClick={handleUpload} className="btn btn-accent" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
                <button onClick={() => { setPreviewUrl(null); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="btn btn-error" disabled={isUploading}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current.click()} className="btn btn-primary">
                Change Picture
              </button>
            )}
          </div>
        </div>

        {/* Change Username */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-center">Change Username</h2>
          <form onSubmit={handleUsernameChange} className="max-w-md mx-auto space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">New Username</span></label>
              <input type="text" className="input input-bordered w-full" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" title="Username can only contain letters, numbers and underscores" />
            </div>
            <button type="submit" className={`btn btn-primary w-full ${isChangingUsername ? 'loading' : ''}`} disabled={isChangingUsername || !newUsername.trim()}>
              {isChangingUsername ? 'Updating...' : 'Change Username'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-center">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="max-w-md mx-auto space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Current Password</span></label>
              <input type="password" className="input input-bordered w-full" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">New Password</span></label>
              <input type="password" className="input input-bordered w-full" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="8" />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Confirm New Password</span></label>
              <input type="password" className="input input-bordered w-full" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="8" />
            </div>
            <button type="submit" className={`btn btn-primary w-full ${isChangingPassword ? 'loading' : ''}`} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}>
              {isChangingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="mt-12 border-t border-error pt-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4 text-error">Account deletion</h2>
          <div className="card bg-opacity-10 border border-error">
            <div className="card-body">
              <h3 className="card-title text-error">Delete Account</h3>
              <p className="text-sm mb-4">This will permanently delete your account and all associated data. This action cannot be undone.</p>
              <button onClick={() => setShowDeleteModal(true)} className="btn btn-error btn-outline">Delete Account</button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirm Account Deletion</h3>
              <p className="mb-4">This action cannot be undone. Please enter your password to confirm.</p>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Password</span></label>
                <input type="password" className="input input-bordered w-full" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost" disabled={isDeleting}>Cancel</button>
                <button onClick={handleDeleteAccount} className={`btn btn-error ${isDeleting ? 'loading' : ''}`} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings;
