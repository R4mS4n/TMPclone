import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar";

const Home = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    console.log(challengeId);
    const res = await fetch(`http://localhost:5000/api/questions/getAllQuestions?challenge_id=${challengeId}`);
    const data = await res.json();

    if (data.length > 0) {
      const firstQuestionId = data[0].question_id;
      // Redirect to the first question
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
      <Navbar />
      <div className="p-4">
        {loading && <div className="text-center text-sm">Loading your challenges...</div>}
        {error && <div className="text-error text-center">Error: {error}</div>}
  
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-4rem)]">
  
            {/* Card 1 - Badges */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg row-span-2 h-full">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-300 rounded-lg" />
              </div>
              <h2 className="text-xl font-bold text-center">Badges</h2>
              <p className="text-center text-gray-600">Badges 53</p>
            </div>
  
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
            <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-2 h-1/2">
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
