import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from "../contexts/ThemeContext";
import CodeForm from '../components/CodeForm';
import languages from '../utils/languages';

export default function ChallengeQuestion() {
  const { challengeId, questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [challengeInfo, setChallengeInfo] = useState(null);
  const [questionIds, setQuestionIds] = useState([]);
  const [template, setTemplate] = useState('');
  const [remainingTime, setRemainingTime] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Fetch challenge info
  useEffect(() => {
    if (challengeId) {
      fetch(`http://localhost:5000/api/tournaments/${challengeId}`)
        .then(res => res.json())
        .then(data => setChallengeInfo(data))
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

  // Fetch question data
  useEffect(() => {
    if (questionId) {
      fetch(`http://localhost:5000/api/questions/${questionId}`)
        .then(res => res.json())
        .then(data => {
          setQuestion(data);
          if (data.template) setTemplate(data.template);
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

  // Fetch question IDs
  useEffect(() => {
    const fetchQuestionIds = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/questions/getAllQuestions?challenge_id=${challengeId}`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        const data = await response.json();
        setQuestionIds(data.map(q => q.question_id));
      } catch (err) {
        console.error("Error fetching question IDs:", err);
      }
    };
    if (challengeId) fetchQuestionIds();
  }, [challengeId]);

  // Setup timer based on challenge limit
  useEffect(() => {
    if (challengeInfo?.time_limit) {
      const minutes = parseInt(challengeInfo.time_limit);
      setRemainingTime(minutes * 60);
    }
  }, [challengeInfo]);

  // Timer countdown
  useEffect(() => {
    if (remainingTime === null) return;
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
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

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeSubmit = async (code, language, languageId) => {

    console.log('Auth Token:', localStorage.getItem('authToken'));

    console.log('[CODE SUBMISSION] Starting submission process');
    console.log('[CODE SUBMISSION] Language:', language);
    console.log('[CODE SUBMISSION] Language ID:', languageId);
    console.log('[CODE SUBMISSION] Question ID:', questionId);
    
    setFeedback({
      status: 'info',
      message: 'Processing submission...',
      details: [{ test: 'System', passed: true, output: 'Your code is being evaluated' }]
    });

    try {
      // Use the provided languageId instead of looking it up
      if (!languageId) {
        console.log('[CODE SUBMISSION] Language ID not provided, looking up by name');
        const languageObj = languages.find(lang => lang.name === language);
        if (!languageObj) {
          console.error('[CODE SUBMISSION] Unsupported language:', language);
          throw new Error(`Unsupported language: ${language}`);
        }
        languageId = languageObj.id;
        console.log('[CODE SUBMISSION] Found language ID:', languageId);
      }

      // Call the backend API to evaluate with Judge0
      console.log('[CODE SUBMISSION] Sending request to backend');
      const response = await fetch('http://localhost:5000/api/questions/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          questionId,
          code,
          languageId,
        }),
      });

      if (!response.ok) {
        console.error('[CODE SUBMISSION] API Error:', response.status);
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[CODE SUBMISSION] Received response from backend:', result);
      
      // Process Judge0 response
      if (result.status && result.status.id) {
        console.log('[CODE SUBMISSION] Judge0 status:', result.status.id, result.status.description);
        
        // For Python submissions, check for the case where the function is correct but no print statements were included
        if (result.status.id === 4 && 
            (language.toLowerCase().includes('python') || languageId === 71) && 
            !code.includes('print(')) {
          console.log('[CODE SUBMISSION] Python code without print statements - likely a correct solution without output');
          
          // Try to extract function name for better feedback
          const functionMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
          const functionName = functionMatch && functionMatch[1] ? functionMatch[1] : "solution";
          
          setFeedback({
            status: 'warning',
            message: 'Your solution may be correct, but you need to add print statements',
            details: [
              { 
                test: 'Execution', 
                passed: false, 
                output: 'Your function executed but did not print any output for evaluation' 
              },
              {
                test: 'Example',
                passed: false,
                output: `Add: print(${functionName}(5)) at the end of your code`
              },
              {
                test: 'Tip',
                passed: false,
                output: 'Judge0 needs to see printed output to compare with expected results'
              }
            ]
          });
          return;
        }
        
        // Special case: function is included in Judge0 output message
        if (result.status.id === 4 && result.status.description === 'Wrong Answer' && 
            result.stdout && !result.stderr && !result.compile_output) {
          console.log('[CODE SUBMISSION] Output produced but not matching expected output');
          setFeedback({
            status: 'error',
            message: 'Wrong Answer - Output Format',
            details: [
              { 
                test: 'Output', 
                passed: false, 
                output: 'Your code ran successfully but produced incorrect output' 
              },
              {
                test: 'Your Output',
                passed: false,
                output: result.stdout || 'No output'
              },
              {
                test: 'Hint',
                passed: false,
                output: 'Check your output format and make sure it exactly matches what is expected'
              }
            ]
          });
          return;
        }
        
        // Handle the case where the Judge0 status is "Accepted" after normalization
        if (result.status.description && result.status.description.includes('after normalization')) {
          console.log('[CODE SUBMISSION] Solution accepted after normalization');
          setFeedback({
            status: 'success',
            message: 'All tests passed successfully!',
            details: [
              { 
                test: 'Test cases', 
                passed: true, 
                output: 'Expected output matched (after whitespace normalization)' 
              },
              { 
                test: 'Performance', 
                passed: true, 
                output: `Memory: ${result.memory || 0}KB, Time: ${result.time || 0}s` 
              }
            ]
          });
          return;
        }

        switch (result.status.id) {
          // Accepted
          case 3:
            console.log('[CODE SUBMISSION] All tests passed successfully');
            setFeedback({
              status: 'success',
              message: 'All tests passed successfully!',
              details: [
                { 
                  test: 'Test cases', 
                  passed: true, 
                  output: result.stdout || 'Expected output matched' 
                },
                { 
                  test: 'Performance', 
                  passed: true, 
                  output: `Memory: ${result.memory || 0}KB, Time: ${result.time || 0}s` 
                }
              ]
            });
            break;
          
          // Compilation Error
          case 6:
            console.log('[CODE SUBMISSION] Compilation error:', result.compile_output);
            setFeedback({
              status: 'error',
              message: 'Compilation Error',
              details: [{ 
                test: 'Compilation', 
                passed: false, 
                output: result.compile_output || 'Failed to compile your code'
              }]
            });
            break;
          
          // Runtime Error
          case 7:
          case 8:
          case 9:
          case 10:
          case 11:
          case 12:
          case 13:
          case 14:
            console.log('[CODE SUBMISSION] Runtime error:', result.stderr);
            setFeedback({
              status: 'error',
              message: 'Runtime Error',
              details: [{ 
                test: 'Execution', 
                passed: false, 
                output: result.stderr || 'Your code crashed during execution'
              }]
            });
            break;
          
          // Wrong Answer
          case 4:
            console.log('[CODE SUBMISSION] Wrong answer');
            console.log('[CODE SUBMISSION] Expected:', result.expected_output);
            console.log('[CODE SUBMISSION] Actual:', result.stdout);
            setFeedback({
              status: 'error',
              message: 'Wrong Answer',
              details: [{ 
                test: 'Test cases', 
                passed: false, 
                output: 'Your output does not match the expected output'
              }]
            });
            break;
          
          // Time Limit Exceeded
          case 5:
            console.log('[CODE SUBMISSION] Time limit exceeded:', result.time);
            setFeedback({
              status: 'error',
              message: 'Time Limit Exceeded',
              details: [{ 
                test: 'Performance', 
                passed: false, 
                output: 'Your code took too long to execute'
              }]
            });
            break;
          
          // Other cases
          default:
            console.log('[CODE SUBMISSION] Other status:', result.status);
            setFeedback({
              status: 'error',
              message: `Code execution status: ${result.status.description}`,
              details: [{ 
                test: 'Judge0', 
                passed: false, 
                output: result.status.description || 'Unknown error'
              }]
            });
        }
      } else {
        console.error('[CODE SUBMISSION] Invalid Judge0 response:', result);
        throw new Error('Invalid response from Judge0');
      }
    } catch (error) {
      console.error('[CODE SUBMISSION] Error:', error);
      setFeedback({
        status: 'error',
        message: 'Error submitting code',
        details: [{ test: 'System Error', passed: false, output: error.message }]
      });
    }
  };

  const goToQuestion = (id) => {
    navigate(`/challenges/${challengeId}/${id}`);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div id="toast-container" className="toast toast-top toast-end z-50 space-y-4"></div>

      {/* Top Bar */}
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

      {/* Main Question Content */}
      {question ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left - Question Details */}
          <div className="md:col-span-1">
            <div className="card bg-base-100 shadow-lg rounded-md">
              <div className="card-body p-6">
                <h2 className="card-title text-xl mb-4">Question Details</h2>

                <div className="space-y-3">
                  <div><span className="text-sm opacity-70">ID:</span><div className="font-medium">{question.question_id}</div></div>
                  <div><span className="text-sm opacity-70">Content:</span><div>{question.content}</div></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="badge badge-primary">{question.language}</div>
                    <div className="badge badge-secondary">{question.topic}</div>
                    <div className="badge badge-accent">{question.difficulty}</div>
                  </div>
                </div>

                {feedback && (
                  <div className={`alert mt-4 ${
                    feedback.status === 'success' ? 'alert-success' :
                    feedback.status === 'error' ? 'alert-error' : 'alert-info'
                  } rounded-md`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

          {/* Right - Code Editor */}
          <div className="md:col-span-2">
            <div className="card bg-base-100 shadow-lg rounded-md h-full">
              <div className="card-body p-6">
                <h2 className="card-title text-xl mb-4">Code Editor</h2>
                <CodeForm
                  language={question.language}
                  initialCode={template}
                  onSubmit={handleCodeSubmit}
                  questionId={question.question_id}
                  questionContent={question.content}
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
