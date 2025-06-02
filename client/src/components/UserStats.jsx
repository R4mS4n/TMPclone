import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

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

  
  const handleUserSelect = (e) => {
    setSelectedUserId(e.target.value);
  };

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-md">
        <label className="label">
          <span className="label-text">Select User</span>
        </label>
        <select 
          className="select select-bordered w-full"
          onChange={handleUserSelect}
          value={selectedUserId}
          disabled={loading}
        >
          <option value="">{loading ? 'Loading users...' : 'Choose a user'}</option>
          {users.map(user => (
            <option key={user.user_id} value={user.user_id}>
              {user.username} (ID: {user.user_id})
            </option>
          ))}
        </select>
      </div>
      {userStats && (
        <div className="border rounded p-4 max-w-2xl">
          <h3 className="font-bold mb-2">User Statistics</h3>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="p-2 border-b">Level</td>
                <td className="p-2 border-b">{userStats.level}</td>
              </tr>
              <tr>
                <td className="p-2 border-b">XP</td>
                <td className="p-2 border-b">{userStats.xp}</td>
              </tr>
              <tr>
                <td className="p-2 border-b">Total Posts</td>
                <td className="p-2 border-b">{userStats.posts}</td>
              </tr>
              <tr>
                <td className="p-2 border-b">Total Comments</td>
                <td className="p-2 border-b">{userStats.comments}</td>
              </tr>
              <tr>
                <td className="p-2 border-b">Challenge Participations</td>
                <td className="p-2 border-b">
                  {userStats.tournaments.count}
                </td>
              </tr>
              <tr>
                <td className="p-2 border-b">Global Rank</td>
                <td className="p-2 border-b">{userStats.global_rank}</td>
              </tr>
              <tr>
                <td className="p-2 border-b">Total Code Submissions</td>
                <td className="p-2 border-b">
                  {userStats.submissions.total} 
                </td>
              </tr>
              <tr>
                <td className="p-2 border-b">Submission accuracy</td>
                <td className="p-2 border-b">
                    {calculateAccuracy(userStats.submissions.correct, userStats.submissions.total)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>

    
  );
};

export default UserStats;