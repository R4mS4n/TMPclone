import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NotificationTest from '../components/NotificationTest';
import { useNotification } from '../contexts/NotificationContext';
import MyProfilePicture from '../components/MyProfilePicture';
import UserAvatar from '../components/UserAvatar';
import { getUnlockedBadges} from '../utils/badgeUtils';
import '../styles/badges.css';
import apiClient from '../utils/api';

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
  const [unlockedBadges, setUnlockedBadges] = useState([]);

  const navigate = useNavigate();
  const { notifyError } = useNotification();

  const openBadgesModal = () => setBadgesModalOpen(true);
  const closeBadgesModal = () => setBadgesModalOpen(false);

  const NewbieCoderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
  
  const FirstChallengeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345h5.518a.562.562 0 01.321.988l-4.204 3.055a.563.563 0 00-.182.557l1.285 5.022a.562.562 0 01-.84.622l-4.48-3.262a.563.563 0 00-.652 0l-4.48 3.262a.562.562 0 01-.84-.622l1.285-5.022a.562.562 0 00-.182-.557l-4.204-3.055a.562.562 0 01.321-.988h5.518a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
  
  const FirstCorrectAnswerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9 9 0 119 0zM16.5 18.75a9 9 0 00-9 0h9zM12 14.25a3 3 0 100-6 3 3 0 000 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25L12 18.75" />
    </svg>
  )

  const AcademicCapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path d="M12 14.25L12 18.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9 9 0 119 0zM16.5 18.75a9 9 0 00-9 0h9zM12 14.25a3 3 0 100-6 3 3 0 000 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 9.75l-7.5 4.5-7.5-4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25v6m13.5-6v6" />
    </svg>
  )

  const FireIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
    </svg>
  )

  const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )

  const CrownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.452-2.452L14.25 6l1.036-.259a3.375 3.375 0 002.452-2.452L18 2.25l.259 1.036a3.375 3.375 0 002.452 2.452L21.75 6l-1.035.259a3.375 3.375 0 00-2.452 2.452zM12 21a8.25 8.25 0 005.25-2.083l-1.12-1.12a6.75 6.75 0 01-8.26 0l-1.12 1.12A8.25 8.25 0 0012 21z" />
    </svg>
  )
  const BoltIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )

  const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );

  const LightBulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a14.994 14.994 0 01-4.5 0M9.75 10.364c.606-.06.936-.342 1.255-.634.318-.29.635-.634.635-1.064 0-.43-.317-.774-.635-1.064a3.003 3.003 0 00-1.255-.634m5.25 0c-.606.06-.936.342-1.255.634a3.003 3.003 0 01-.635 1.064c0 .43.317.774.635 1.064.319.29.636.634 1.255.634m-3.75 2.311a9.04 9.04 0 01-4.5 0" />
    </svg>
  );

  const ShieldCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3.75 3.75a3.75 3.75 0 10-5.303-5.303A3.75 3.75 0 009 12.75zm12-3.75a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CommandLineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H2.25A2.25 2.25 0 000 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );

  const BugAntIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75c0 .414-.168.75-.375.75S9 13.164 9 12.75s.168-.75.375-.75.375.336.375.75zM14.25 12.75c0 .414-.168.75-.375.75S13.5 13.164 13.5 12.75s.168-.75.375-.75.375.336.375.75zM12 15.75c-3.443 0-6.25-1.007-6.25-2.25s2.807-2.25 6.25-2.25 6.25 1.007 6.25 2.25-2.807 2.25-6.25 2.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75v3M10.125 15.75L6.937 18.25M13.875 15.75l3.188 2.5M12 8.25v-3m-3.375-.375L6.937 2.75m6.125 2.125L17.063 2.75" />
    </svg>
  )

  const RocketLaunchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.875 14.25l-4.5-4.5 4.5-4.5m4.5 9l4.5-4.5-4.5-4.5M12 3v18" />
    </svg>
  )

  const badgeIcons = {
    "Newbie Coder": NewbieCoderIcon,
    "Code Pup": NewbieCoderIcon,
    "Junior Dev": AcademicCapIcon,
    "Senior Dev": AcademicCapIcon,
    "Code Wizard": FireIcon,
    "Legendary Hacker": FireIcon,
    "First Challenge": FirstChallengeIcon,
    "Regular Player": TrophyIcon,
    "Challenge Lover": HeartIcon,
    "Tournament Master": CrownIcon,
    "Ultimate Champion": CrownIcon,
    "Challenge God": BoltIcon,
    "First Post": PencilIcon,
    "First Correct Answer": FirstCorrectAnswerIcon,
    "Problem Solver": LightBulbIcon,
    "Code Ninja": ShieldCheckIcon,
    "Algorithm Master": CommandLineIcon,
    "Debugging King": BugAntIcon,
    "IT Wizard": RocketLaunchIcon,
    "Absolute Unit": RocketLaunchIcon,
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        setUserProfile(res.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    };

    const fetchLeaderboardPosition = async () => {
      try {
        const response = await apiClient.get('/users/leaderboard-position');
        const data = response.data;
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
        const response = await apiClient.get('/leaderboard/10leaderboard');
        const data = response.data;

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
        const res = await apiClient.get('/users/enrollments');
        setEnrollments(res.data.enrollments || []);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchChallengesCount = async () => {
      try {
        const response = await apiClient.get('/tournaments/enrolled-count');
        const data = response.data;
        if (data.success) {
          setChallengesCount(data.count);
        }
      } catch (err) {
        console.error('Error fetching challenges count:', err);
      }
    };

    const fetchLevelStats = async () => {
      try {
        const res = await apiClient.get('/users/level-stats');
        setLevelStats(res.data);
      } catch (err) {
        console.error('Error fetching level stats:', err);
        setError(err.message);
      }
    };
    
    const getRankIcon = (position) => {
      if (position === 1) return '🥇';
      if (position === 2) return '🥈';
      if (position === 3) return '🥉';
      return `#${position}`;
    };

    const fetchUserStats = async () => {
      if (!userProfile) return;
      try {
        const response = await apiClient.get(`/users/stats/${userProfile.user_id}`);
        const data = response.data;
        if (data.success) {
          setUnlockedBadges(getUnlockedBadges(data.stats));
        } else {
          notifyError('Failed to fetch user stats');
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        notifyError('An error occurred while fetching user stats');
      }
    };

    const loadData = async () => {
      try {
        await fetchProfile();
        await fetchEnrollments();
        await fetchLevelStats();
        await fetchChallengesCount();
        await fetchLeaderboardPosition();
        await fetchTop5Leaderboard();
        await fetchUserStats();
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, notifyError, userProfile?.user_id, levelStats.xp, leaderboardPosition]);

  const handleChallengeClick = async (challengeId) => {
    try {
      const response = await apiClient.get(`/questions/getAllQuestions?challenge_id=${challengeId}`);
      const questions = response.data;
      if (questions.length > 0) {
        navigate(`/challenges/${challengeId}/${questions[0].question_id}`);
      } else {
        notifyError("No questions found for this challenge.");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      notifyError("Failed to load questions for the challenge.");
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

           {/* Badges Display */}
              <div className="col-span-3 bg-base-100 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Your Badges</h2>
                
                {unlockedBadges.length === 0 ? (
                  <div className="text-center p-8">
                    <p className="text-gray-500 mb-4">No badges yet! Complete challenges to earn some~</p>
                    <button 
                      onClick={() => navigate('/challenges')}
                      className="btn btn-primary"
                    >
                      Start Earning Badges!
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {unlockedBadges.map((badge, index) => {
                      const Icon = badgeIcons[badge.name];
                      return (
                        <div
                          key={index}
                          className="tooltip tooltip-bottom"
                          data-tip={`${badge.name}: ${badge.description}`}
                        >
                          <div className="badge-container">
                            <div className="badge-item">
                              <div className="badge-icon">
                                  {Icon ? <Icon /> : <span className="text-3xl">{badge.emoji}</span>}
                              </div>
                            </div>
                            <div className="badge-name">{badge.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Home;
