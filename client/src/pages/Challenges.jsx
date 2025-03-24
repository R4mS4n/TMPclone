import React, { useEffect, useState } from "react";

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/tournaments"); // Fetch from backend
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

  return (
    <div>
      <h2>Available Challenges</h2>
      <ul>
        {challenges.map((challenge) => (
          <li key={challenge.tournament_id}>
            <h3>{challenge.name}</h3>
            <p>{challenge.description}</p>
            <p><strong>Time Limit:</strong> {challenge.time_limit} mins</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Challenges;

