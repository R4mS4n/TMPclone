import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  // Import useNavigate

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();  // Initialize useNavigate

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

  if (loading) return <p>Loading challenges...</p>;
  if (error) return <p>Error: {error}</p>;

  // Handle button click to navigate to a specific challenge detail page
  const handleButtonClick = (id) => {
    navigate(`/challenge-details/${id}`);  // Navigate to the challenge details page
  };

  return (
    <div>
      <h2>Available Challenges</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {challenges.map((challenge) => (
          <div key={challenge.tournament_id}>
            <button onClick={() => handleButtonClick(challenge.tournament_id)}>
              View Challenge {challenge.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Challenges;

