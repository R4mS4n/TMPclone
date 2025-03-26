import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";  // Import useParams and useNavigate

const ChallengeDetails = () => {
  const { id } = useParams();  // Access the challenge ID from the URL
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();  // Initialize useNavigate
  const [userId, setUserId]=useState(null); //Store user_id :33

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
  
  //user participation handling
  
  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch("http://localhost:5000/api/user/me", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (response.ok) {
            setUserId(data.user_id);
          } else {
            setError("Failed to fetch user details");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          setError("Error fetching user details");
        }
      }
    };
    
    fetchUserId();
  }, []); 
  
  /*
  const checkEnrollment = async(userId)=>{
    try{
    }
  }
    */
  const handleParticipate = async () => {
    if (!userId) {
      alert("You must be logged in to participate");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/tournaments/participate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,  // Send token as Bearer
        },
        body: JSON.stringify({
          user_id: userId,  // Use the fetched user_id here
          tournament_id: id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Successfully enrolled in the challenge!");
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error enrolling in tournament:", error);
      alert("Error enrolling in tournament");
    }
  };
  
  if (loading) return <p>Loading challenge details...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>{challenge.name}</h2>
      <p>{challenge.description}</p>
      <p><strong>Time Limit:</strong> {challenge.time_limit} minutes</p>

      {/* Button to participate */}
      <button onClick={handleParticipate}>Participate in Challenge</button>

      {/* Button to go back to challenges page */}
      <button onClick={() => navigate('/challenges')}>Back to Challenges</button>
    </div>
  );
};

export default ChallengeDetails;

