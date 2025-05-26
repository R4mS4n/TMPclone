import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeTest from "../components/ThemeTest";
import NotificationTest from '../components/NotificationTest';
import { useNotification } from '../contexts/NotificationContext';

const Home = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBadgesModalOpen, setBadgesModalOpen] = useState(false);
  const navigate = useNavigate();
  const { notifyError } = useNotification();

  const openBadgesModal = () => setBadgesModalOpen(true);
  const closeBadgesModal=()=>setBadgesModalOpen(false);
  const [levelStats, setLevelStats] = useState({
    level: 1,
    remainder: 0,
    xp: 0
  });

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

  // Run all fetches in parallel
  Promise.all([
    fetchProfile(),
    fetchEnrollments(),
    fetchLevelStats()
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
        <NotificationTest />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-4rem)]">
          {/* Profile Card */}
          <div className="bg-base-100 p-6 rounded-lg shadow-lg row-span-2 h-full flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden mb-4">
              {/* Si tu BD trae profile_pic, úsala aquí: */}
              {userProfile?.profile_pic
                ? <img src={userProfile.profile_pic} alt="Profile" className="object-cover w-full h-full" />
                : <img
                    src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
              }
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              {userProfile.username}
            </h2>

            {/* Aquí dejas tu barra de nivel */}
            <div className="bg-base-100 p-4 rounded-lg shadow w-full mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {levelStats.level}
                </div>
                <div>
                  <div className="font-semibold">Level {levelStats.level}</div>
                  <div className="text-xs text-gray-500">{500-levelStats.remainder} Points to next level</div>
                </div>
              </div>
              <div className="relative h-4 bg-yellow-100 rounded-full overflow-hidden mt-2">
                <div
                  className="absolute top-0 left-0 h-full bg-yellow-400 flex items-center justify-center text-xs text-yellow-800 font-semibold"
                  style={{ width: `${(levelStats.remainder / 500) * 100}%` }}
                >
                  ⭐ {levelStats.remainder}/500
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 w-full mb-4">
              <div className="bg-base-100 rounded-lg p-3 shadow flex flex-col items-center justify-center">
                <div className="text-2xl">⚡</div>
                <div className="font-semibold">55</div>
                <div className="text-xs text-gray-500">Challenges</div>
              </div>
              <div className="bg-base-100 rounded-lg p-3 shadow flex flex-col items-center justify-center">
                <div className="text-2xl">📈</div>
                <div className="font-semibold">#17</div>
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
          <div className="col-span-2 grid grid-cols-3 gap-6">
            {/* Done Recently */}
            <div className="bg-base-100 p-6 rounded-lg shadow-lg col-span-2 flex flex-col gap-4 h-[20rem]">
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
            <div className="bg-base-100 p-4 rounded-2xl shadow-lg flex flex-col h-[20rem]">
              <h2 className="text-xl font-bold text-center mb-4 bg-primary text-base-200 py-2 rounded-md">
                Leaderboard
              </h2>
              {/* Tu lista de leaderboard aquí */}
            </div>

            {/* Daily Challenge */}
            <div className="col-span-3 bg-base-100 p-6 rounded-lg shadow-lg flex flex-col items-center gap-4 min-h-[16rem]">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
