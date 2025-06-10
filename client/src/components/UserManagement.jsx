import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';
import ManageUserPenaltiesSidebar from './admin/ManageUserPenaltiesSidebar';
import apiClient from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState({ user_id: null, username: '', mail: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { notifySuccess, notifyError, confirm } = useNotification();

  // State for the new Manage User Penalties Sidebar
  const [showManagePenaltiesSidebar, setShowManagePenaltiesSidebar] = useState(false);
  const [selectedUserForPenalties, setSelectedUserForPenalties] = useState(null);

  const baseBtn = "px-4 py-2 rounded-md transition-colors";
  const primaryBtn = `${baseBtn} bg-primary hover:bg-primary-focus text-primary-content`;
  const secondaryBtn = `${baseBtn} bg-base-300 hover:bg-base-200 text-base-content`;
  const linkBtn = "text-red-600 hover:text-red-700 transition-colors font-bold";

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('fetchUsers error:', err);
      notifyError(err.response?.data?.error || 'Error listing users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get('/users/me');
      const data = res.data;
      if (data && data.user) {
        setCurrentUser(data.user);
      } else if (data && !data.user && Object.keys(data).length > 0 && data.user_id) {
        setCurrentUser(data);
      } else {
        throw new Error('User data not found in /me response');
      }
    } catch (err) {
      console.error('fetchCurrentUser error:', err);
      notifyError('Could not load your session details: ' + (err.response?.data?.error || err.message));
      setCurrentUser(null);
    }
  };

  const handleEdit = (user) => {
    setIsEditing(true);
    setEditingUser({ user_id: user.user_id, username: user.username, mail: user.mail });
    setShowUserModal(true);
  };

  const handleDelete = async (id) => {
    confirm('Are you sure you want to delete this user? This action is irreversible.', async () => {
      try {
        await apiClient.delete(`/admin/users/${id}`);
        notifySuccess('User deleted successfully');
        await fetchUsers();
      } catch (err) {
        console.error('handleDelete error:', err);
        notifyError(err.response?.data?.error || 'Could not delete user');
      }
    });
  };

  const handleSubmit = async () => {
    if (!editingUser || !editingUser.user_id) {
      notifyError('No user selected for editing.');
      return;
    }
    try {
      await apiClient.put(`/admin/users/${editingUser.user_id}`, {
        username: editingUser.username
      });

      notifySuccess('User updated successfully');
      setShowUserModal(false);
      await fetchUsers();
    } catch (err) {
      console.error('handleSubmit error for user edit:', err);
      notifyError(err.response?.data?.error || 'Error saving user details');
    }
  };

  // Function to open the manage penalties sidebar
  const openManagePenaltiesSidebar = (user) => {
    setSelectedUserForPenalties(user);
    setShowManagePenaltiesSidebar(true);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 0: return <span className="badge badge-neutral">Usuario</span>;
      case 1: return <span className="badge badge-warning text-black">Admin</span>;
      case 2: return <span className="badge badge-info text-black">SuperAdmin</span>;
      default: return <span className="badge">Desconocido</span>;
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-base-100 p-6 text-base-content">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">User Management</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6 p-4 bg-neutral text-neutral-content rounded-md shadow">
        <input 
          type="text"
          placeholder="Search by username or email..."
          className="input input-bordered w-full max-w-sm bg-base-100 text-base-content placeholder-base-content placeholder-opacity-60 h-12"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="overflow-x-auto shadow-lg rounded-md">
        <table className="table table-zebra w-full table-compact">
          <thead className="bg-base-300 text-base-content">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-4 text-center">Loading users...</td>
              </tr>
            ) : users && users.length > 0 ? (
              users.map((u) => (
                <tr key={u.user_id} className="hover:bg-base-200">
                  <td className="px-4 py-2 font-semibold">{u.user_id}</td>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.mail}</td>
                  <td className="px-4 py-2">
                    {/* Role Change UI commented out 
                    currentUser?.role === 2 && u.role !== 2 && currentUser?.user_id !== u.user_id ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.user_id, parseInt(e.target.value))}
                        className="select select-bordered select-sm rounded-md h-10"
                        disabled // Disabled until backend support is confirmed
                      >
                        <option value={0}>User</option>
                        <option value={1}>Admin</option>
                      </select>
                    ) : */ getRoleBadge(u.role)}
                  </td>
                  <td className="px-4 py-2 flex flex-wrap gap-1">
                    { (currentUser?.user_id !== u.user_id) && (
                      <>
                        <button 
                          onClick={() => handleEdit(u)} 
                          className="btn btn-xs btn-outline btn-info rounded-md"
                          disabled={u.role !== 0} 
                        >
                          Edit Username
                        </button>
                        <button 
                          onClick={() => handleDelete(u.user_id)} 
                          className="btn btn-xs btn-outline btn-error rounded-md"
                          disabled={u.role !== 0} 
                        >
                          Delete User
                        </button>
                        <button 
                          onClick={() => openManagePenaltiesSidebar(u)} 
                          className="btn btn-xs btn-outline btn-warning rounded-md"
                          // This button should ideally be enabled for all non-self users
                          // regardless of role, as penalties can apply to admins too.
                        >
                          Manage Penalties
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.user_id} className="hover:bg-base-200">
                  <td className="px-4 py-2 font-semibold">{u.user_id}</td>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.mail}</td>
                  <td className="px-4 py-2">
                    {/* Role Change UI commented out 
                    currentUser?.role === 2 && u.role !== 2 && currentUser?.user_id !== u.user_id ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.user_id, parseInt(e.target.value))}
                        className="select select-bordered select-sm rounded-md h-10"
                        disabled // Disabled until backend support is confirmed
                      >
                        <option value={0}>User</option>
                        <option value={1}>Admin</option>
                      </select>
                    ) : */ getRoleBadge(u.role)}
                  </td>
                  <td className="px-4 py-2 flex flex-wrap gap-1">
                    { (currentUser?.user_id !== u.user_id) && (
                      <>
                        <button 
                          onClick={() => handleEdit(u)} 
                          className="btn btn-xs btn-outline btn-info rounded-md"
                          disabled={u.role !== 0} 
                        >
                          Edit Username
                        </button>
                        <button 
                          onClick={() => handleDelete(u.user_id)} 
                          className="btn btn-xs btn-outline btn-error rounded-md"
                          disabled={u.role !== 0} 
                        >
                          Delete User
                        </button>
                        <button 
                          onClick={() => openManagePenaltiesSidebar(u)} 
                          className="btn btn-xs btn-outline btn-warning rounded-md"
                          // This button should ideally be enabled for all non-self users
                          // regardless of role, as penalties can apply to admins too.
                        >
                          Manage Penalties
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-4 text-center">
                  {searchTerm ? `No users found matching "${searchTerm}".` : 'No users found or failed to load users.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ManageUserPenaltiesSidebar Integration */}
      <AnimatePresence>
        {showManagePenaltiesSidebar && selectedUserForPenalties && (
          <ManageUserPenaltiesSidebar 
            user={selectedUserForPenalties}
            onClose={() => {
              setShowManagePenaltiesSidebar(false);
              setSelectedUserForPenalties(null);
            }}
            onActionSuccess={() => {
              fetchUsers(); // Refresh users list in the main table
              // The sidebar itself will also call its own fetchUserPenalties internally after an action.
              // Optionally, could also force close, but better to let admin continue if they need to.
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 w-1/3 h-full bg-base-100 shadow-lg p-6 z-50"
          >
            <div className="flex justify-between items-center mb-6 border-b border-base-300 pb-4">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <button onClick={() => setShowUserModal(false)} className="btn btn-sm btn-ghost text-base-content/70 hover:bg-base-200">
                ✕
              </button>
            </div>

            <div className="space-y-4 flex-grow overflow-y-auto">
              <div>
                <label className="block mb-1">Usuario</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.mail}
                  onChange={(e) => setEditingUser({ ...editingUser, mail: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-base-300 flex justify-end space-x-3">
              <button onClick={() => setShowUserModal(false)} className="btn btn-ghost rounded-md">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary rounded-md">Save Changes</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
