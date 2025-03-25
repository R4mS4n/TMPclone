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
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <h2>Available Challenges</h2>
      {challenges.map((challenge) => (
        <button
          key={challenge.tournament_id}
          style={{
            padding: "10px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "16px",
          }}
        >
          <h3 style={{ margin: "0" }}>{challenge.name}</h3>
          <p style={{ margin: "5px 0" }}>{challenge.description}</p>
          <p style={{ margin: "5px 0" }}>
            <strong>Time Limit:</strong> {challenge.time_limit} mins
          </p>
        </button>
      ))}
    </div>
  );
};

export default Challenges;
