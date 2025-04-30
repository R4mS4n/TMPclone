import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CodeForm from '../components/CodeForm.jsx'
export default function ChallengeQuestion() {
  const { challengeId, questionId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState(null);
  const [challengeInfo, setChallengeInfo] = useState(null); // this holds the name, desc, etc.

  // First, get the challenge info (with tournament name)
  useEffect(() => {
    if (challengeId) {
      fetch(`http://localhost:5000/api/tournaments/${challengeId}`)
        .then(res => res.json())
        .then(data => {
          setChallengeInfo(data);
        })
        .catch(err => {
          console.error("Ugh, challenge fetch drama:", err);
        });
    }
  }, [challengeId]);

  // Second, get the questions
  useEffect(() => {
    fetch(`/api/questions?challenge_id=${challengeId}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        if (data.length > 0) {
          setFirstQuestion(data[0]);
        }
      })
      .catch(error => {
        console.error('[ERROR] Failed to fetch questions:', error);
      });
  }, [challengeId]);

  useEffect(() => {
    if (questionId) {
      fetch(`http://localhost:5000/api/questions/${questionId}`)
        .then(res => res.json())
        .then(data => {
          setQuestion(data);
        })
        .catch(err => {
          console.error("Failed to fetch question:", err);
        });
    }
  }, [questionId]);

  return (
    <div>
      <h1>
        {challengeInfo?.name || "Loading..."}
      </h1>

      {question ? (
        <div>
          <h4>Question Content:</h4>
          <p><strong>ID:</strong> {question.question_id}</p>
          <p><strong>Content:</strong> {question.content}</p>
          <p><strong>Language:</strong> {question.language}</p>
          <p><strong>Topic:</strong> {question.topic}</p>
          <p><strong>Difficulty:</strong> {question.difficulty}</p>
        <CodeForm/>
        </div>
      ) : (
        <p>Loading question info...</p>
      )}
    </div>
  );
}
