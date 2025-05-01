import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from "../components/NavBar.jsx";
import CodeForm from '../components/CodeForm.jsx'
import languages from '../utils/languages';

export default function ChallengeQuestion() {
  const { challengeId, questionId } = useParams();
  //const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState(null);
  const [challengeInfo, setChallengeInfo] = useState(null); // this holds the name, desc, etc.
  const [questionIds, setQuestionIds] = useState([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState(null);
  const navigate = useNavigate();

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
        });
    }
  }, [challengeId]);

  useEffect(() => {
    if (questionId) {
      fetch(`http://localhost:5000/api/questions/${questionId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Question data:", data);
          setQuestion(data);
        })
        .catch(err => {
          console.error("Failed to fetch question:", err);
        });
    }
  }, [questionId]);

  useEffect(() => {
    const fetchQuestionIds = async () => {
      try {
        console.log("challenge id: ", challengeId)
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
  
  useEffect(()=>{

    console.log(questionIds);
  });
  

  
  return (
    <div>
      <h1>
        {challengeInfo?.name || "Loading..."}
      </h1>
      <div className="my-4">
        <h3>Jump to Question:</h3>
      {questionIds.map((id) => (
      <button
          key={id}
          onClick={() => navigate(`/challenges/${challengeId}/${id}`)}
          >
            {id}
          </button>
        ))}
      </div>

      {question ? (
        <div>
          <h4>Question Content:</h4>
          <p><strong>Content:</strong> {question.content}</p>
          <p><strong>Language:</strong> {question.language}</p>
          <p><strong>Topic:</strong> {question.topic}</p>
          <p><strong>Difficulty:</strong> {question.difficulty}</p>

        <div>
      {question.test_inputs && (
  <div className="my-2">
    <p><strong>Test Inputs:</strong></p>
    <pre>{question.test_inputs}</pre>
  </div>
    )}

      {question.expected_outputs && (
  <div className="my-2">
    <p><strong>Expected Outputs:</strong></p>
    <pre>{question.expected_outputs}</pre>
  </div>
    )}

      <label>Select Language:</label>
    <select
      value={selectedLanguageId || ""}
      onChange={(e) => setSelectedLanguageId(Number(e.target.value))}
  >
      <option value="" disabled>Select a language</option>
      {languages.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.name}
        </option>
        ))}
      </select>
    </div>

        <CodeForm
          questionId={question.question_id}
          languageId={selectedLanguageId}
        />
        </div>
      ) : (
        <p>Loading question info...</p>
      )}
    </div>
  );
}
