import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeTest from "../components/ThemeTest";
import NotificationTest from '../components/NotificationTest';
import { useNotification } from '../contexts/NotificationContext';

const Home = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBadgesModalOpen, setBadgesModalOpen] = useState(false);
  const navigate = useNavigate();
  const { notifyError } = useNotification();

  const openBadgesModal = () => setBadgesModalOpen(true);
  const closeBadgesModal = () => setBadgesModalOpen(false);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/user/enrollments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch enrollments');

        const data = await response.json();
        setEnrollments(data.enrollments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [navigate]);

  const handleChallengeClick = async (challengeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/questions/getAllQuestions?challenge_id=${challengeId}`);
      const data = await res.json();

      if (data.length > 0) {
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

  return (
    <div className="min-h-screen">
      <div className="p-4">
        <NotificationTest />

        {loading && <div className="text-center text-sm">Loading your challenges...</div>}
        {error && <div className="text-error text-center">Error: {error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-4rem)]">

            {/* Profile Card */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg row-span-2 h-full flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden mb-4">
                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" alt="Profile" className="object-cover w-full h-full" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Jane Doe</h2>

              {/* Level Info */}
              <div className="bg-base-100 p-4 rounded-lg shadow w-full mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <div className="font-semibold">Level 2</div>
                    <div className="text-xs text-gray-500">500 Points to next level</div>
                  </div>
                </div>
                <div className="relative h-4 bg-yellow-100 rounded-full overflow-hidden mt-2">
                  <div className="absolute top-0 left-0 h-full bg-yellow-400 flex items-center justify-center text-xs text-yellow-800 font-semibold" style={{ width: "86%" }}>
                    ⭐ 5200/6000
                  </div>
                </div>
              </div>

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

              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-gray-400">My Badges</h2>
                  <button onClick={openBadgesModal} className="text-primary hover:underline text-sm font-semibold">More &gt;</button>
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
                      <div key={i} className="bg-base-300 h-16 rounded-lg flex items-center justify-center">
                        🏅
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button onClick={closeBadgesModal} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/80">Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* Right Side */}
            <div className="col-span-2 grid grid-cols-3 gap-6">

              {/* Done Recently */}
              <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-2 flex flex-col gap-4 h-[20rem]">
                <h2 className="text-xl font-bold">Done Recently...</h2>
                {enrollments.slice(0, 5).map((challenge, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-semibold mb-1">
                    <span>{challenge.challenge_name}</span>
                    <Link to="/challenges" className="text-primary hover:underline">continue &gt;</Link>
                  </div>
                ))}
                {enrollments.length > 5 && (
                  <div className="text-sm text-center">
                    <Link to="/challenges" className="text-primary hover:underline font-semibold">...</Link>
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div className="bg-base-200 p-4 rounded-2xl shadow-lg flex flex-col h-[20rem]">
                <h2 className="text-xl font-bold text-center mb-4 bg-primary text-base-200 py-2 rounded-md">Leaderboard</h2>
                <div className="flex flex-col gap-2 overflow-y-auto scroll-hidden flex-1">
                  {[
                    { rank: 1, username: "User1WithAVeryLongName", points: 4800 },
                    { rank: 2, username: "User2WithAVeryLongName", points: 4600 },
                    { rank: 3, username: "User3WithAVeryLongName", points: 4400 },
                    { rank: 4, username: "User4", points: 4200 },
                    { rank: 5, username: "User5", points: 4000 },
                  ].map((user) => {
                    const isTop3 = user.rank <= 3;
                    const medalColors = {
                      1: "text-yellow-500",
                      2: "text-gray-400",
                      3: "text-amber-700",
                    };

                    return (
                      <div key={user.rank} className="flex items-center gap-2 bg-base-300 px-2 py-2 rounded-md shadow-sm text-sm">
                        <div className="w-5 h-5 relative flex items-center justify-center shrink-0">
                          {isTop3 ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-5 h-5 ${medalColors[user.rank]}`}>
                                <path fillRule="evenodd" d="M12 1.69a.494.494 0 0 0-.438-.494 32.352 32.352 0 0 0-7.124 0A.494.494 0 0 0 4 1.689v.567c-.811.104-1.612.24-2.403.406a.75.75 0 0 0-.595.714 4.5 4.5 0 0 0 4.35 4.622A3.99 3.99 0 0 0 7 8.874V10H6a1 1 0 0 0-1 1v2h-.667C3.597 13 3 13.597 3 14.333c0 .368.298.667.667.667h8.666a.667.667 0 0 0 .667-.667c0-.736-.597-1.333-1.333-1.333H11v-2a1 1 0 0 0-1-1H9V8.874a3.99 3.99 0 0 0 1.649-.876 4.5 4.5 0 0 0 4.35-4.622.75.75 0 0 0-.596-.714A30.897 30.897 0 0 0 12 2.256v-.567Z" clipRule="evenodd" />
                              </svg>
                              <span className="absolute top-0.5 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-white leading-none">
                                {user.rank}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">{user.rank}</span>
                          )}
                        </div>

                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-5-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9c-1.825 0-3.422.977-4.295 2.437A5.49 5.49 0 0 0 8 13.5a5.49 5.49 0 0 0 4.294-2.063A4.997 4.997 0 0 0 8 9Z" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="truncate whitespace-nowrap font-medium text-[13px]">
                            {user.username}
                          </div>
                        </div>

                        <div className="w-[64px] text-right font-semibold text-[13px]">
                          {user.points} pts
                        </div>
                      </div>
                    );
                  })}

                  {17 > 5 && (
                    <div className="flex items-center gap-2 bg-error/50 px-2 py-2 rounded-md shadow-sm text-sm font-semibold text-base-content">
                      <div className="w-5 h-5 text-xs flex items-center justify-center text-gray-400 shrink-0">17</div>
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                          <path d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-5-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9c-1.825 0-3.422.977-4.295 2.437A5.49 5.49 0 0 0 8 13.5a5.49 5.49 0 0 0 4.294-2.063A4.997 4.997 0 0 0 8 9Z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate whitespace-nowrap">You</div>
                      </div>
                      <div className="text-right">2740 pts</div>
                    </div>
                  )}
                </div>

                <Link to="/leaderboard" className="text-center text-gray-400 hover:text-primary cursor-pointer mt-1 text-2xl font-bold">
                  ...
                </Link>
              </div>

              {/* Daily Challenge */}
              <div className="col-span-3 bg-base-200 p-6 rounded-lg shadow-lg flex flex-col items-center gap-4 min-h-[16rem]">
                <h2 className="text-xl font-bold">Daily Challenge</h2>
                <div className="grid grid-cols-3 gap-4 w-full">
                  {[
                    { day: "Today", status: "Completed" },
                    { day: "Yesterday", status: "Incomplete" },
                    { day: "Monday", status: "Completed" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-base-100 rounded-lg p-4 flex flex-col items-center justify-center">
                      <div className="font-semibold">{item.day}</div>
                      <div className={`text-xs mt-1 ${item.status === "Completed" ? "text-green-500" : "text-red-500"}`}>
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
