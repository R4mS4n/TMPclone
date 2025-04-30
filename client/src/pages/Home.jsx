import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeTest from "../components/ThemeTest";

const Home = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBadgesModalOpen, setBadgesModalOpen] = useState(false);
  const navigate = useNavigate();

  const openBadgesModal = () => setBadgesModalOpen(true);
  const closeBadgesModal = () => setBadgesModalOpen(false);

  useEffect(() => {
    // Puedes descomentar esta lógica cuando actives el backend
    /*
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
    */
    setTimeout(() => setLoading(false), 500);
  }, [navigate]);

  const handleChallengeClick = async (challengeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/questions/getAllQuestions?challenge_id=${challengeId}`);
      const data = await res.json();
      if (data.length > 0) {
        const firstQuestionId = data[0].question_id;
        window.location.href = `/challenges/${challengeId}/${firstQuestionId}`;
      } else {
        alert('No questions found for this challenge.');
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      alert('Error loading challenge.');
    }
  };

  return (
    <div className="min-h-screen">
      <ThemeTest />
      <div className="p-4">
        {loading && <div className="text-center text-sm">Loading your challenges...</div>}
        {error && <div className="text-error text-center">Error: {error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-4rem)]">
            {/* LEFT - Profile & Info */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg row-span-2 h-full flex flex-col items-center">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden">
                  <img
                    src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Jane Doe</h2>

              <div className="bg-base-100 p-4 rounded-lg shadow w-full mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-semibold">Level 2</div>
                    <div className="text-xs text-gray-500">500 Points to next level</div>
                  </div>
                </div>
                <div className="relative h-4 bg-yellow-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="absolute top-0 left-0 h-full bg-yellow-400 flex items-center justify-center text-xs text-yellow-800 font-semibold"
                    style={{ width: "86%" }}
                  >
                    ⭐ 5200/6000
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2</span>
                  <span>3</span>
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
                  <h2 className="text-xl font-bold text-gray-400">Badges 53</h2>
                  <button
                    onClick={openBadgesModal}
                    className="text-primary hover:underline text-sm font-semibold"
                  >
                    Badges &gt;
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-base-100 rounded-lg h-30"></div>
                  <div className="bg-base-100 rounded-lg h-30"></div>
                  <div className="bg-base-100 rounded-lg h-30"></div>
                </div>
              </div>
            </div>

            {/* MODAL: Badges */}
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

            {/* RIGHT - Enrollments, Leaderboard, Daily Challenge */}
            <div className="col-span-2 grid grid-cols-3 gap-6 h-3/5">
              <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-2 h-3/5">
                <h2 className="text-xl font-bold text-center">Your Challenges</h2>
                {enrollments.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {enrollments.map((challenge) => (
                      <button
                        key={challenge.challenge_id}
                        className="w-full bg-white hover:bg-gray-100 border border-gray-200 text-left px-4 py-2 rounded-md shadow-sm"
                        onClick={() => handleChallengeClick(challenge.challenge_id)}
                      >
                        {challenge.challenge_name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-4">No enrollments yet.</p>
                )}
              </div>

              {/* Daily Challenge Placeholder */}
              <div className="col-span-1 bg-base-200 p-6 rounded-lg shadow-lg h-full">
                <h2 className="text-xl font-bold text-center">Daily Challenge</h2>
                <p className="text-center text-gray-600">Coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
