import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/tournaments");
        if (!response.ok) throw new Error("Failed to fetch challenges");

        const data = await response.json();
        setChallenges(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const handleButtonClick = (id) => {
    navigate(`/challenge-details/${id}`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 container mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Available Challenges</h1>
          <p className="text-base-content opacity-80">Browse and participate in coding challenges</p>
        </div>
        <div className="stats shadow mt-4 md:mt-0 bg-base-200 w-full md:w-auto">
          <div className="stat px-6">
            <div className="stat-title">Total Challenges</div>
            <div className="stat-value text-primary">{challenges.length}</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center my-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}
      
      {error && (
        <div className="alert alert-error rounded-md my-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && challenges.length === 0 && (
        <div className="alert alert-info rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>No challenges available at the moment. Check back later!</span>
        </div>
      )}

      {!loading && !error && challenges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.tournament_id}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full"
            >
              <div className="card-body p-6">
                <div className="card-actions justify-end">
                  <div className="badge badge-primary">Challenge</div>
                </div>
                <h2 className="card-title text-base-content">{challenge.name}</h2>
                <p className="text-base-content opacity-70 line-clamp-2">
                  {challenge.description || "Test your skills with this exciting challenge!"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="badge badge-outline">
                    Date Limit: {challenge.date_limit 
                      ? new Date(challenge.date_limit).toLocaleString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })
                      : "3 min"}
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button
                    onClick={() => handleButtonClick(challenge.tournament_id)}
                    className="btn btn-primary rounded-md w-full md:w-auto min-w-[140px] font-normal h-10"
                  >
                    View Challenge
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Challenges;
