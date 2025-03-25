import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";  // Import useParams and useNavigate

const ChallengeDetails = () => {
  const { id } = useParams();  // Access the challenge ID from the URL
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();  // Initialize useNavigate

  useEffect(() => {
    const fetchChallengeDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/tournaments/${id}`);
        if (!response.ok) throw new Error("Failed to fetch challenge details");

        const data = await response.json();
        setChallenge(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeDetails();
  }, [id]);

  if (loading) return <p>Loading challenge details...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>{challenge.name}</h2>
      <p>{challenge.description}</p>
      <p><strong>Time Limit:</strong> {challenge.time_limit} minutes</p>

      {/* Button to participate */}
      <button>Participate in Challenge</button>

      {/* Button to go back to challenges page */}
      <button onClick={() => navigate('/challenges')}>Back to Challenges</button>
    </div>
  );
};

export default ChallengeDetails;

