import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const ChallengeDetails = () => {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { isDark } = useTheme();
  
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
          setIsEnrolled(enrollmentData.enrolled);
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
      
      // Show toast notification instead of alert
      const message = isEnrolled ? "You've successfully left the challenge" : "You've successfully joined the challenge!";
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = `alert alert-success rounded-md shadow-lg transition-all duration-500 opacity-100`;
        toast.innerHTML = `
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>${message}</span>
          </div>
        `;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
          toast.classList.add('opacity-0');
          setTimeout(() => toastContainer.removeChild(toast), 500);
        }, 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      
      // Show error toast
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = `alert alert-error rounded-md shadow-lg transition-all duration-500 opacity-100`;
        toast.innerHTML = `
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>${error.message}</span>
          </div>
        `;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
          toast.classList.add('opacity-0');
          setTimeout(() => toastContainer.removeChild(toast), 500);
        }, 3000);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <div className="alert alert-error rounded-md my-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
        <button className="btn btn-primary rounded-md mt-4 min-w-[140px] font-normal h-10" onClick={() => navigate('/challenges')}>
          Back to Challenges
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      {/* Toast container for notifications */}
      <div id="toast-container" className="toast toast-top toast-end z-50 space-y-4"></div>
      
      {/* Back navigation */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/challenges')} 
          className="btn btn-ghost btn-sm gap-2 rounded-md font-normal h-9"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Challenges
        </button>
      </div>
      
      {/* Challenge header */}
      <div className="card bg-base-100 shadow-lg rounded-md overflow-hidden mb-8">
        <div className="card-body p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="card-title text-2xl md:text-3xl font-bold text-primary">{challenge.name}</h1>
              <div className="badge badge-outline mt-2">Time Limit: {challenge.time_limit} minutes</div>
            </div>
            <button 
              onClick={handleParticipateOrDrop}
              className={`btn ${isEnrolled ? 'btn-error' : 'btn-success'} rounded-md w-full md:w-auto min-w-[180px] px-6 font-normal h-10`}
            >
              {isEnrolled ? "Drop Challenge" : "Participate in Challenge"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Challenge details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2">
          <div className="card bg-base-100 shadow-lg rounded-md h-full">
            <div className="card-body p-6">
              <h2 className="card-title text-xl mb-4">Challenge Description</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-base-content">{challenge.description || "No description available for this challenge."}</p>
              </div>
              
              {isEnrolled && (
                <div className="card-actions justify-end mt-6">
                  <button 
                    onClick={() => navigate(`/challenges/${id}/1`)} 
                    className="btn btn-primary rounded-md min-w-[140px] px-6 font-normal h-10"
                  >
                    Start Challenge
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="card bg-base-100 shadow-lg rounded-md h-full">
            <div className="card-body p-6">
              <h2 className="card-title text-xl mb-4">Challenge Info</h2>
              
              <div className="stats stats-vertical shadow bg-base-200 w-full">
                <div className="stat px-6 py-4">
                  <div className="stat-title">Status</div>
                  <div className="stat-value text-sm">
                    {isEnrolled ? (
                      <span className="text-success">Enrolled</span>
                    ) : (
                      <span className="text-error">Not Enrolled</span>
                    )}
                  </div>
                </div>
                
                <div className="stat px-6 py-4">
                  <div className="stat-title">Time Limit</div>
                  <div className="stat-value text-primary">{challenge.time_limit} min</div>
                </div>
                
                <div className="stat px-6 py-4">
                  <div className="stat-title">Difficulty</div>
                  <div className="stat-value text-warning">Medium</div>
                </div>
              </div>
              
              <div className="alert alert-info mt-4 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <h3 className="font-bold">Remember!</h3>
                  <div className="text-xs">You must complete the challenge within the time limit.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetails;

