import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NotificationTest from '../components/NotificationTest';
import { useNotification } from '../contexts/NotificationContext';
import MyProfilePicture from '../components/MyProfilePicture';
import UserAvatar from '../components/UserAvatar';

const Home = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBadgesModalOpen, setBadgesModalOpen] = useState(false);
  const [challengesCount, setChallengesCount] = useState(0);
  const [leaderboardPosition, setLeaderboardPosition] = useState(null);
  const [top5Leaderboard, setTop5Leaderboard] = useState([]);
  const [levelStats, setLevelStats] = useState({ level: 1, remainder: 0, xp: 0 });

  const navigate = useNavigate();
  const { notifyError } = useNotification();

  const openBadgesModal = () => setBadgesModalOpen(true);
  const closeBadgesModal = () => setBadgesModalOpen(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUserProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    };

    const fetchLeaderboardPosition = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/leaderboard-position', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        //console.log('Leaderboard position response:', data);
        if (data.success && data.position) {
          setLeaderboardPosition(data.position); 
        }
      } catch (err) {
        console.error('Error fetching leaderboard position:', err);
      }
    };


    // ✅ Modified
    const fetchTop5Leaderboard = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/leaderboard/10leaderboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (Array.isArray(data)) {
          const top5 = data.slice(0, 5);
          const userInTop5 = top5.some(user => user.user_id === userProfile?.user_id);

          if (leaderboardPosition && !userInTop5) {
            const currentUser = {
              user_id: userProfile.user_id,
              username: userProfile.username,
              xp: levelStats.xp,
              position: leaderboardPosition
            };

            setTop5Leaderboard([...top5, currentUser]);
          } else {
            setTop5Leaderboard(top5);
          }

        }
      } catch (err) {
        console.error('Error fetching top 5 leaderboard:', err);
      }
    };

    const fetchEnrollments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/enrollments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch enrollments');
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchChallengesCount = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tournaments/enrolled-count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setChallengesCount(data.count);
        }
      } catch (err) {
        console.error('Error fetching challenges count:', err);
      }
    };

    const fetchLevelStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/level-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) throw new Error('Failed to fetch level stats');
        const data = await res.json();
        setLevelStats(data);
      } catch (err) {
        console.error('Error fetching level stats:', err);
        notifyError('Failed to load level information');
      }
    };
    
    const getRankIcon = (position) => {
      if (position === 1) return '🥇';
      if (position === 2) return '🥈';
      if (position === 3) return '🥉';
      return `#${position}`;
    };


    Promise.all([
      fetchProfile(),
      fetchEnrollments(),
      fetchLevelStats(),
      fetchChallengesCount(),
      fetchLeaderboardPosition(),
      fetchTop5Leaderboard()
    ]).finally(() => setLoading(false));
  }, [navigate]);

  const handleChallengeClick = async (challengeId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/questions/getAllQuestions?challenge_id=${challengeId}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const firstQuestionId = data[0].question_id;
        navigate(`/challenges/${challengeId}/${firstQuestionId}`);
      } else {
        notifyError('No questions found for this challenge.');
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      notifyError('Error loading challenge.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-xl">Loading your profile and challenges…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <NotificationTest />
        <div className="text-error text-center">Error: {error}</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-base-200">
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-4rem)]">
          {/* Profile Card */}
          <div className="bg-base-100 p-6 rounded-lg shadow-lg row-span-2 h-full flex flex-col items-center">
            <div className="mb-4">
              <MyProfilePicture className="w-24 h-24 border-2 border-white" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              {userProfile.username}
            </h2>

            {/* Barra */}
            <div className="bg-base-100 p-4 rounded-lg shadow w-full mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {levelStats.level}
                </div>
                <div>
                  <div className="font-semibold">Level {levelStats.level}</div>
                  <div className="text-xs text-gray-500">XP to next level: {500 - levelStats.remainder}</div>
                  <div className="text-xs text-gray-500">Total XP: {levelStats.xp}</div>
                </div>
              </div>
              {/* Dynamic XP Bar */}
              {(() => {
                const percent = (levelStats.remainder / 500) * 100;
                let barColor = "bg-[#FF253A]"; // leaderboard button red
                if (percent > 70) barColor = "bg-green-400";
                else if (percent > 30) barColor = "bg-yellow-400";
                return (
                  <div className="relative h-8 shadow-md" style={{ backgroundColor: '#FF6B81', minHeight: '2rem', borderRadius: '0.375rem', overflow: 'hidden', marginTop: '1rem' }}>
                    <div
                      className={`absolute top-0 left-0 h-full ${barColor} flex items-center pl-4 text-base text-black font-bold transition-all duration-300 rounded-md`}
                      style={{ width: `${percent}%`, minWidth: percent > 0 ? '2.5rem' : '0' }}
                    >
                      <span className="ml-2 whitespace-nowrap text-sm">{levelStats.remainder}/500 XP ⭐</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 w-full mb-4">
              <div className="bg-base-100 rounded-lg p-3 shadow flex flex-col items-center justify-center">
                <div className="text-2xl">⚡</div>
                <div className="font-semibold">{challengesCount}</div>
                <div className="text-xs text-gray-500">Challenges</div>
              </div>
              <div className="bg-base-100 rounded-lg p-3 shadow flex flex-col items-center justify-center">
                <div className="text-2xl">📈</div>
                <div className="font-semibold">
                  {leaderboardPosition ? `#${leaderboardPosition}` : 'Loading...'}
                </div>
                <div className="text-xs text-gray-500">Leaderboard</div>
              </div>
            </div>

            {/* Badges */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-400">My Badges</h2>
                <button onClick={openBadgesModal} className="text-primary hover:underline text-sm font-semibold">
                  More &gt;
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-base-100 rounded-lg h-16"></div>
                <div className="bg-base-100 rounded-lg h-16"></div>
                <div className="bg-base-100 rounded-lg h-16"></div>
              </div>
            </div>
          </div>

          {/* Badges Modal */}
          {isBadgesModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">All Badges</h2>
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-base-300 h-16 rounded-lg flex items-center justify-center"
                    >
                      🏅
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={closeBadgesModal}
                    className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/80"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Side */}
          <div className="lg:col-span-1 row-span-2 grid grid-cols-2 gap-6">
            {/* Done Recently */}
            <div className="bg-base-100 p-6 rounded-lg shadow-lg col-span-1 flex flex-col gap-4 h-full">
              <h2 className="text-xl font-bold">Done Recently...</h2>
              {enrollments.slice(0, 5).map((ch, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm font-semibold mb-1"
                >
                  <span
                    onClick={() => handleChallengeClick(ch.challenge_id)}
                    className="cursor-pointer hover:underline"
                  >
                    {ch.challenge_name}
                  </span>
                  <Link to="/challenges" className="text-primary hover:underline">
                    continue &gt;
                  </Link>
                </div>
              ))}
              {enrollments.length > 5 && (
                <div className="text-sm text-center">
                  <Link to="/challenges" className="text-primary hover:underline font-semibold">
                    ...
                  </Link>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-base-100 p-4 rounded-2xl shadow-lg flex flex-col h-full overflow-y-auto">
              <h2 className="text-xl font-bold text-center mb-4 bg-primary text-base-200 py-2 rounded-md">
                Leaderboard
              </h2>
              <ul className="divide-y divide-base-300">
                {top5Leaderboard.map((user) => (
                  <li
                    key={user.user_id}
                    className={`flex justify-between items-center px-2 py-2 ${
                      user.user_id === userProfile?.user_id ? 'bg-primary text-white rounded-md font-bold' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 text-center">
                        {user.position === 1 && '🥇'}
                        {user.position === 2 && '🥈'}
                        {user.position === 3 && '🥉'}
                        {user.position > 3 && `#${user.position}`}

                      </span>
                      <span>{user.username}</span>
                    </span>
                    <span className="text-sm">{user.xp} XP</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Daily Challenge */}
            {/* <div className="col-span-3 bg-base-100 p-6 rounded-lg shadow-lg flex flex-col items-center gap-4 min-h-[16rem]">
              <h2 className="text-xl font-bold">Daily Challenge</h2>
              <div className="grid grid-cols-3 gap-4 w-full">
                {[
                  { day: "Today", status: "Completed" },
                  { day: "Yesterday", status: "Incomplete" },
                  { day: "Monday", status: "Completed" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-base-100 rounded-lg p-4 flex flex-col items-center justify-center"
                  >
                    <div className="font-semibold">{item.day}</div>
                    <div
                      className={`text-xs mt-1 ${
                        item.status === "Completed" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
