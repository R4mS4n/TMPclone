import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar"
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

  if (loading) return <div className="loading">Loading your challenges...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="home-container">
    <Navbar/>
      <h1>Your Enrolled Challenges</h1>
      
      {enrollments.length > 0 ? (
        <div className="challenges-list">
          {enrollments.map((challenge) => (
            <button
              key={challenge.challenge_id}
              className="challenge-button"
              onClick={() => navigate(`/challenges/${challenge.challenge_id}`)}
            >
              <div className="button-content">
                <span className="challenge-name">{challenge.challenge_name}</span>
            <br/>
                <span className="challenge-meta">
                      Score: {challenge.score}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You haven't enrolled in any challenges yet.</p>
          <button 
            onClick={() => navigate('/challenges')}
            className="browse-button"
          >
            Browse Challenges
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
