import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-primary">Available Challenges</h1>
      <p className="mb-4 text-base-content">You should see this if you're logged in</p>

      {loading && <p className="text-sm">Loading challenges...</p>}
      {error && <p className="text-error">Error: {error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.tournament_id}
              className="p-4 bg-base-100 shadow rounded-lg"
            >
              <h2 className="font-semibold">{challenge.name}</h2>
              <button
                onClick={() => handleButtonClick(challenge.tournament_id)}
                className="btn btn-sm btn-primary mt-2"
              >
                View Challenge
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Challenges;
