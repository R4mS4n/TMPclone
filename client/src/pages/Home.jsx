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
            {/* CARD 1 - Badges */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg row-span-2 h-full">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-300 rounded-lg" />
              </div>
              <h2 className="text-xl font-bold text-center">Badges</h2>
              <p className="text-center text-gray-600">Badges 53</p>
              <div className="text-center mt-4">
                <button onClick={openBadgesModal} className="btn btn-sm btn-primary">See Badges</button>
              </div>
            </div>

            {/* Modal for Badges */}
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

            {/* Right Top Row */}
            <div className="col-span-2 grid grid-cols-3 gap-6 h-1/2">
              {/* Enrolled Challenges */}
              <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-2">
                <h2 className="text-xl font-bold text-center">Your Challenges</h2>
                {enrollments.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {enrollments.map((challenge) => (
                      <button
                        key={challenge.challenge_id}
                        className="w-full bg-white hover:bg-gray-100 border border-gray-200 text-left px-4 py-2 rounded-md shadow-sm"
                        onClick={() => handleChallengeClick(challenge.challenge_id)}
                      >
                        <span className="font-semibold">{challenge.challenge_name}</span>
                        <br />
                        <span className="text-sm text-gray-500">Score: {challenge.score}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm mt-4">
                    You haven't enrolled in any challenges yet.
                    <br />
                    <button
                      onClick={() => navigate('/challenges')}
                      className="btn btn-sm btn-primary mt-2"
                    >
                      Browse Challenges
                    </button>
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-1">
                <h2 className="text-xl font-bold text-center">Leaderboard</h2>
                <p className="text-center text-gray-600">Coming soon</p>
              </div>
            </div>

            {/* Daily Challenge */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-3 h-1/2">
              <h2 className="text-xl font-bold text-center">Daily Challenge</h2>
              <p className="text-center text-gray-600">Coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
