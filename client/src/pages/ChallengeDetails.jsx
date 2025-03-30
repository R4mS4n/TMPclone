import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";  // Import useParams and useNavigate

const ChallengeDetails = () => {
  const { id } = useParams();  //to access challeng id from the url
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();  // Initialize useNavigate
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  /*
   Aqui abajo sacamos la info primordial para que jale chido la pagina esta, que son los datos del torneo y si el usuario esta participando o no
  */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengeRes = await fetch(`http://localhost:5000/api/tournaments/${id}`);
        if (!challengeRes.ok) throw new Error("Failed to fetch challenge");
        const challengeData = await challengeRes.json();


        if (localStorage.getItem("authToken")) {
          const enrollmentRes = await fetch(
            `http://localhost:5000/api/tournaments/enrollment/${id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
          const enrollmentData = await enrollmentRes.json();
          //console.log(enrollmentData);
          setIsEnrolled(enrollmentData.enrolled);
          console.log(enrollmentData.enrolled)
        }

        setChallenge(challengeData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleParticipateOrDrop = async () => {
    if (!localStorage.getItem("authToken")) {
      alert("Please login first");
      navigate('/login');
      return;
    }

    const endpoint = isEnrolled 
      ? "http://localhost:5000/api/tournaments/quitTournament" 
      : "http://localhost:5000/api/tournaments/participateInTournament";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ tournament_id: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Operation failed");
      }

      setIsEnrolled(!isEnrolled);
      alert(`Successfully ${isEnrolled ? "left" : "joined"} the challenge!`);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
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

