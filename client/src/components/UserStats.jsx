import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import SearchableDropdown from './SearchableDropdown';

const UserStats = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const { notifyError } = useNotification();
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const calculateAccuracy = (correct, total) => {
    if (total === 0) return 0;
    return parseFloat(((correct / total) * 100).toFixed(2));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:5000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        notifyError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;

    const fetchUserStats = async () => {
      setStatsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5000/api/users/stats/${selectedUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');
        const statsData = await response.json();
        console.log(statsData);
        setUserStats(statsData.stats);
      } catch (error) {
        notifyError(error.message);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [selectedUserId]);

  
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-6 text-center">
        <span className="loading loading-lg loading-spinner text-primary"></span>
        <p>Loading users...</p>
      </div>
    );
  }
  
  const userOptions = users.map(user => ({
    label: `${user.username} (ID: ${user.user_id})`,
    value: user.user_id
  }));

  return (
    <div className="p-4 md:p-6 bg-base-100 text-base-content min-h-screen rounded-md">
      <h1 className="text-2xl font-bold mb-6 text-primary">User Statistics Dashboard</h1>

      <div className="mb-6 p-4 bg-neutral text-neutral-content rounded-md shadow">
        <label htmlFor="userSearch" className="label pb-2">
          <span className="label-text text-lg">Select User to View Stats</span>
        </label>
        <SearchableDropdown
          options={userOptions}
          value={selectedUserId}
          onChange={handleUserSelect}
          placeholder="Search for a user by name or ID..."
        />
      </div>

      {statsLoading && (
        <div className="p-6 text-center">
          <span className="loading loading-lg loading-spinner text-primary"></span>
          <p>Loading statistics...</p>
        </div>
      )}

      {!statsLoading && selectedUserId && !userStats && (
         <div className="p-6 text-center text-warning">
            <p>No statistics found for the selected user, or user has no relevant activity.</p>
         </div>
      )}

      {userStats && !statsLoading && (
        <div className="p-4 bg-base-200 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-secondary">
            Statistics for: {users.find(u => u.user_id === selectedUserId)?.username || 'Selected User'}
          </h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full table-compact rounded-md shadow-md">
              <thead className="bg-base-300 text-base-content">
                <tr>
                  <th className="p-3">Statistic Category</th>
                  <th className="p-3">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover">
                  <td className="p-3 font-medium">Level</td>
                  <td className="p-3">{userStats.level}</td>
                </tr>
                <tr className="hover">
                  <td className="p-3 font-medium">XP</td>
                  <td className="p-3">{userStats.xp}</td>
                </tr>
                <tr className="hover">
                  <td className="p-3 font-medium">Total Posts</td>
                  <td className="p-3">{userStats.posts}</td>
                </tr>
                <tr className="hover">
                  <td className="p-3 font-medium">Total Comments</td>
                  <td className="p-3">{userStats.comments}</td>
                </tr>
                <tr className="hover">
                  <td className="p-3 font-medium">Challenge Participations</td>
                  <td className="p-3">{userStats.tournaments.count}</td>
                </tr>
                <tr className="hover">
                  <td className="p-3 font-medium">Global Rank</td>
                  <td className="p-3">{userStats.global_rank ? `#${userStats.global_rank}` : 'N/A'}</td>
                </tr>
                <tr className="hover">
                  <td className="p-3 font-medium">Total Code Submissions</td>
                  <td className="p-3">{userStats.submissions.total}</td>
                </tr>
                <tr className="hover">
                  <td className="p-3 font-medium">Correct Submissions</td>
                  <td className="p-3">{userStats.submissions.correct}</td>
                </tr>
                <tr className="hover">
                  <td className="p-3 font-medium">Submission Accuracy</td>
                  <td className="p-3">
                    <span className={`font-semibold ${calculateAccuracy(userStats.submissions.correct, userStats.submissions.total) >= 75 ? 'text-success' : calculateAccuracy(userStats.submissions.correct, userStats.submissions.total) >= 50 ? 'text-warning' : 'text-error'}`}>
                      {calculateAccuracy(userStats.submissions.correct, userStats.submissions.total)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStats;