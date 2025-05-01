import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from "../contexts/ThemeContext";
import CodeForm from '../components/CodeForm';

// Code editor can be installed separately with:
// npm install react-syntax-highlighter --save

export default function ChallengeQuestion() {
  const { challengeId, questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [challengeInfo, setChallengeInfo] = useState(null);
  const [questionIds, setQuestionIds] = useState([]);
  const [remainingTime, setRemainingTime] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [template, setTemplate] = useState('');
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  // Timer functionality
  useEffect(() => {
    if (challengeInfo?.time_limit) {
      const minutes = parseInt(challengeInfo.time_limit);
      setRemainingTime(minutes * 60); // Convert to seconds
    }
  }, [challengeInfo]);

  // Countdown timer
  useEffect(() => {
    if (remainingTime === null) return;
    
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Handle time's up - could automatically submit or show warning
          setFeedback({
            status: 'error',
            message: 'Time is up!',
            details: [{ test: 'Timer', passed: false, output: 'Your solution was not submitted in time.' }]
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingTime]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // First, get the challenge info (with tournament name)
  useEffect(() => {
    if (challengeId) {
      fetch(`http://localhost:5000/api/tournaments/${challengeId}`)
        .then(res => res.json())
        .then(data => {
          setChallengeInfo(data);
        })
        .catch(err => {
          console.error("Challenge fetch error", err);
          setFeedback({
            status: 'error',
            message: 'Failed to load challenge',
            details: [{ test: 'API', passed: false, output: err.message }]
          });
        });
    }
  }, [challengeId]);

  useEffect(() => {
    if (questionId) {
      fetch(`http://localhost:5000/api/questions/${questionId}`)
        .then(res => res.json())
        .then(data => {
          setQuestion(data);
          // For template code
          if (data.template) {
            setTemplate(data.template);
          }
        })
        .catch(err => {
          console.error("Failed to fetch question:", err);
          setFeedback({
            status: 'error',
            message: 'Failed to load question',
            details: [{ test: 'API', passed: false, output: err.message }]
          });
        });
    }
  }, [questionId]);

  useEffect(() => {
    const fetchQuestionIds = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/questions/getAllQuestions?challenge_id=${challengeId}`);
        if (!response.ok) throw new Error('Failed to fetch questions');

        const data = await response.json();
        const ids = data.map(q => q.question_id);
        setQuestionIds(ids);
      } catch (err) {
        console.error("Error fetching question IDs:", err);
      }
    };

    if (challengeId) {
      fetchQuestionIds();
    }
  }, [challengeId]);

  const handleCodeSubmit = async (code) => {
    // Show feedback status as we process
    setFeedback({
      status: 'info',
      message: 'Processing submission...',
      details: [{ test: 'System', passed: true, output: 'Your code is being evaluated' }]
    });
    
    try {
      // Mock submission - replace with actual API call
      // const response = await fetch('http://localhost:5000/api/submissions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      //   },
      //   body: JSON.stringify({
      //     question_id: questionId,
      //     code: code,
      //     language: question.language
      //   })
      // });
      
      // const data = await response.json();
      
      // Simulate API response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success feedback
      setFeedback({
        status: 'success',
        message: 'All tests passed successfully!',
        details: [
          { test: 'Test case 1', passed: true, output: 'Expected output matched' },
          { test: 'Test case 2', passed: true, output: 'Expected output matched' },
          { test: 'Performance', passed: true, output: 'Execution time: 0.021s' }
        ]
      });
      
    } catch (error) {
      setFeedback({
        status: 'error',
        message: 'Error submitting code',
        details: [{ test: 'Error', passed: false, output: error.message }]
      });
    }
  };

  const goToQuestion = (id) => {
    navigate(`/challenges/${challengeId}/${id}`);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Toast container for notifications */}
      <div id="toast-container" className="toast toast-top toast-end z-50 space-y-4"></div>
      
      {/* Timer and Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(`/challenge-details/${challengeId}`)}
          className="btn btn-ghost btn-sm gap-2 rounded-md font-normal h-9"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Challenge
        </button>
        
        {remainingTime !== null && (
          <div className={`text-lg font-mono ${remainingTime < 60 ? 'text-error' : remainingTime < 180 ? 'text-warning' : 'text-primary'}`}>
            Time: {formatTime(remainingTime)}
          </div>
        )}
      </div>

      {/* Challenge Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          {challengeInfo?.name || "Loading..."}
        </h1>
      </div>

      {/* Question Navigation */}
      <div className="mb-8">
        <h3 className="font-bold mb-2">Jump to Question:</h3>
        <div className="btn-group">
          {questionIds.length > 0 ? (
            questionIds.map((id) => (
              <button
                key={id}
                onClick={() => goToQuestion(id)}
                className={`btn ${id === parseInt(questionId) ? 'btn-primary' : 'btn-outline'} rounded-md font-normal h-10`}
              >
                {id}
              </button>
            ))
          ) : (
            <div className="badge badge-neutral">No questions available</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {question ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Question Content */}
          <div className="md:col-span-1">
            <div className="card bg-base-100 shadow-lg rounded-md">
              <div className="card-body p-6">
                <h2 className="card-title text-xl mb-4">Question Details</h2>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm opacity-70">ID:</div>
                    <div className="font-medium">{question.question_id}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm opacity-70">Content:</div>
                    <div className="prose max-w-none">
                      {question.content || "No content available."}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="badge badge-primary">{question.language}</div>
                    <div className="badge badge-secondary">{question.topic}</div>
                    <div className="badge badge-accent">{question.difficulty}</div>
                  </div>
                </div>
                
                {/* Feedback Display */}
                {feedback && (
                  <div className={`alert ${
                    feedback.status === 'success' ? 'alert-success' : 
                    feedback.status === 'error' ? 'alert-error' : 
                    'alert-info'
                  } mt-4 rounded-md`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      {feedback.status === 'success' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : feedback.status === 'error' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <div>
                      <h3 className="font-bold">{feedback.message}</h3>
                      <div className="text-xs">
                        {feedback.details.map((detail, index) => (
                          <div key={index} className={detail.passed ? 'text-success-content' : 'text-error-content'}>
                            {detail.test}: {detail.output}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="md:col-span-2">
            <div className="card bg-base-100 shadow-lg rounded-md h-full">
              <div className="card-body p-6">
                <h2 className="card-title text-xl mb-4">Code Editor</h2>
                <CodeForm 
                  language={null}
                  initialCode={template}
                  onSubmit={handleCodeSubmit}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center my-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}
    </div>
  );
}
