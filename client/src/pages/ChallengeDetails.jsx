import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";  // Import useParams and useNavigate

const ChallengeDetails = () => {
  const { id } = useParams();  // Access the challenge ID from the URL
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();  // Initialize useNavigate
  const [userId, setUserId]=useState(null); //Store user_id :33
  const [isEnrolled, setIsEnrolled] = useState(false);


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
            checkEnrollment(data.user_id);
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
  
  //we need to check the enrollment of the user so we know what to display
  const checkEnrollment = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tournaments/enrollment/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (data.enrolled) {
        setIsEnrolled(true); // Set to true if the user is already enrolled
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
  };

  const handleParticipateOrDrop = async () => {
    if (!userId) {
      alert("You must be logged in to participate");
      return;
    }
    console.log(isEnrolled)
    if (isEnrolled) {
      // Drop challenge (remove participation)
      try {
        const response = await fetch("http://localhost:5000/api/tournaments/quitTournament", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            user_id: userId,
            tournament_id: id,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          alert("Successfully quit the challenge!");
          setIsEnrolled(false); // Update button text after successful drop
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error("Error quitting challenge:", error);
        alert("Error quitting challenge");
      }
    } else {
      // Participate in the challenge
      try {
        const response = await fetch("http://localhost:5000/api/tournaments/participate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            user_id: userId,
            tournament_id: id,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          alert("Successfully enrolled in the challenge!");
          setIsEnrolled(true); // Change button text to "Drop Challenge"
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error("Error enrolling in tournament:", error);
        alert("Error enrolling in tournament");
      }
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
      <button onClick={handleParticipateOrDrop}>
        {isEnrolled ? "Drop Challenge" : "Participate in Challenge"}
      </button>


      {/* Button to go back to challenges page */}
      <button onClick={() => navigate('/challenges')}>Back to Challenges</button>
    </div>
  );
};

export default ChallengeDetails;

