import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';
import apiClient from '../utils/api';

const TournamentManagement = () => {
  const [tournaments, setTournaments] = useState([]);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTournament, setCurrentTournament] = useState({
    name: '',
    description: '',
    date_limit: ''
  });
  const [loading, setLoading] = useState(true);
  const { notify, notifySuccess, notifyError, confirm } = useNotification();
  const [showQuestionsFrame, setShowQuestionsFrame] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Common button styles with consistent shape
  const baseButtonStyle = "px-4 py-2 rounded-md transition-colors";
  const primaryButtonStyle = `${baseButtonStyle} bg-primary hover:bg-primary-focus text-primary-content`;
  const secondaryButtonStyle = `${baseButtonStyle} bg-base-300 hover:bg-base-200 text-base-content`;
  const linkButtonStyle = "text-red-600 hover:text-red-700 transition-colors font-bold";

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await apiClient.get('/tournaments');
      setTournaments(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tournament) => {
    setIsEditing(true);
    setCurrentTournament(tournament);
    setShowTournamentModal(true);
  };

  const handleDelete = async (tournamentId) => {
    confirm(
      'Are you sure you want to delete this tournament?', 
      async () => {
        try {
          await apiClient.delete(`/tournaments/${tournamentId}`);

          await fetchTournaments();
        } catch (error) {
          console.error('Error deleting tournament:', error);
          notifyError(error.response?.data?.error || 'Failed to delete tournament');
        }
      }
    );
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentTournament({
      name: '',
      description: '',
      date_limit: ''
    });
    setShowTournamentModal(true);
  };

  const handleSubmit = async () => {
    console.log('Submitting form:', { isEditing, currentTournament });
    
    try {
      const url = isEditing 
        ? `/tournaments/${currentTournament.tournament_id}` 
        : '/tournaments';

      const method = isEditing ? 'put' : 'post';
      
      console.log(`Making ${method} request to ${url}`);
      
      const response = await apiClient[method](url, currentTournament);

      let responseData = response.data;
      console.log('Response:', responseData);

      if (!response.ok) {
        throw new Error(
          (responseData && responseData.error) || 
          (isEditing ? 'Failed to update tournament' : 'Failed to create tournament')
        );
      }
      
      // Successfully saved, now update the UI
      console.log('Tournament saved successfully');
      notifySuccess(isEditing ? 'Tournament updated successfully!' : 'Tournament created successfully!');
      await fetchTournaments();
      setCurrentTournament({
        ...currentTournament,
        tournament_id: responseData?.tournament?.tournament_id || currentTournament.tournament_id
      });
      console.log('Tournaments refreshed');
      setShowTournamentModal(false);
      setShowQuestionsFrame(false);
      setCurrentTournament({ name: '', description: '', date_limit: '' });
    } catch (error) {
      console.error('Error submitting tournament:', error);
      notifyError(error.response?.data?.error || error.message);
    }
  };

  const fetchQuestions = async (tournamentId) => {
    setIsLoadingQuestions(true);
    try {
      const response = await apiClient.get(`/questions/getAllQuestions?challenge_id=${tournamentId}`);

      const data = response.data;
      setQuestions(data);
    } catch (err) {
      notifyError(err.response?.data?.error || 'Failed to fetch questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleUpdateQuestion = async () => {
    try {
      const response = await apiClient.put(`/questions/update/${currentTournament.question_id}`, {
        content: currentTournament.content,
        language: currentTournament.language,
        topic: currentTournament.topic,
        difficulty: currentTournament.difficulty,
        test_inputs: currentTournament.test_inputs,
        expected_outputs: currentTournament.expected_outputs
      });

      const data = response.data;
      notifySuccess('Question updated successfully!');
      fetchQuestions(currentTournament.tournament_id);
    } catch (err) {
      notifyError(err.response?.data?.error || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (question_id) => {
    confirm('Are you sure you want to delete this question?', async () => {
      try {
        await apiClient.delete(`/questions/delete/${question_id}`);
        notifySuccess('Question deleted successfully!');
        fetchQuestions(currentTournament.tournament_id);
      } catch (err) {
        notifyError(err.response?.data?.error || 'Failed to delete question');
      }
    });
  };

  const renderQuestionForm = () => {
    return (
      <div className="mt-4 p-4 border-2 border-accent rounded-md bg-base-200 space-y-4">
        <h3 className="font-semibold text-lg">
          {currentTournament.question_id ? "Update Question" : "Add Question"}
        </h3>

        <div>
          <label className="label text-base-content">Content</label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows="3"
            placeholder="Write the question content..."
            value={currentTournament.content || ''}
            onChange={(e) =>
              setCurrentTournament({ ...currentTournament, content: e.target.value })
            }
          />
        </div>

        <div>
          <label className="label text-base-content">Language</label>
          <input
            className="input input-bordered w-full"
            placeholder="e.g. Python, JavaScript..."
            value={currentTournament.language || ''}
            onChange={(e) =>
              setCurrentTournament({ ...currentTournament, language: e.target.value })
            }
          />
        </div>

        <div>
          <label className="label text-base-content">Topic</label>
          <input
            className="input input-bordered w-full"
            placeholder="Topic name"
            value={currentTournament.topic || ''}
            onChange={(e) =>
              setCurrentTournament({ ...currentTournament, topic: e.target.value })
            }
          />
        </div>

        <div>
          <label className="label text-base-content">Difficulty</label>
          <select
            className="select select-bordered w-full"
            value={currentTournament.difficulty || ''}
            onChange={(e) =>
              setCurrentTournament({ ...currentTournament, difficulty: e.target.value })
            }
          >
            <option value="">Select difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="label text-base-content">Test Inputs</label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows="2"
            placeholder='["1\n", "2\n"]'
            value={currentTournament.test_inputs || ''}
            onChange={(e) =>
              setCurrentTournament({ ...currentTournament, test_inputs: e.target.value })
            }
          />
        </div>

        <div>
          <label className="label text-base-content">Expected Outputs</label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows="2"
            placeholder='["1\n", "1\n"]'
            value={currentTournament.expected_outputs || ''}
            onChange={(e) =>
              setCurrentTournament({ ...currentTournament, expected_outputs: e.target.value })
            }
          />
        </div>
        <div>
          <button
            onClick={currentTournament.question_id ? handleUpdateQuestion : handleAddQuestion}
            className={primaryButtonStyle}
          >
            {currentTournament.question_id ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </div>
    );
  };

  const handleAddQuestion = async () => {
    try {
      const response = await apiClient.post('/questions/', {
        tournament_id: currentTournament.tournament_id,
        content: currentTournament.content,
        language: currentTournament.language,
        topic: currentTournament.topic,
        difficulty: currentTournament.difficulty,
        test_inputs: currentTournament.test_inputs,
        expected_outputs: currentTournament.expected_outputs,
      });

      const data = response.data;
      notifySuccess('Question added successfully!');
      fetchQuestions(currentTournament.tournament_id);
      // Reset question fields
      setCurrentTournament({
        ...currentTournament,
        content: '',
        language: '',
        topic: '',
        difficulty: '',
        test_inputs: '',
        expected_outputs: ''
      });
    } catch (err) {
      notifyError(err.response?.data?.error || 'Failed to add question');
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-6 text-base-content">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <button
          onClick={handleCreate}
          className={primaryButtonStyle}
        >
          Create New Tournament
        </button>
      </div>

      <AnimatePresence>
        {showTournamentModal && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 w-1/3 h-full bg-base-100 shadow-lg p-6 z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Tournament' : 'New Tournament'}</h2>
              <button
                onClick={() => {
                  setShowTournamentModal(false);
                  setShowQuestionsFrame(false);
                }}
                className="text-base-content/60 hover:text-base-content transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text text-base-content">Name</span>
                </label>
                <input
                  type="text"
                  value={currentTournament.name}
                  onChange={(e) => setCurrentTournament({ ...currentTournament, name: e.target.value })}
                  className="w-full rounded-lg bg-base-200 text-base-content px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Name of tournament"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text text-base-content">Description</span>
                </label>
                <textarea
                  value={currentTournament.description}
                  onChange={(e) => setCurrentTournament({ ...currentTournament, description: e.target.value })}
                  className="w-full rounded-lg bg-base-200 text-base-content px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="4"
                  placeholder="Write the description"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text text-base-content">Date Limit (Date and Time)</span>
                </label>
                <input
                  type="datetime-local"
                  value={
                    currentTournament.date_limit 
                      ? new Date(new Date(currentTournament.date_limit).getTime() - new Date().getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16)
                      : ''
                  }
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')} ${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}:${String(selectedDate.getSeconds()).padStart(2, '0')}`;
                    
                    setCurrentTournament({ ...currentTournament, date_limit: formattedDate });
                  }}
                  className="w-full rounded-lg bg-base-200 text-base-content px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Select Date and Time"
                  required
                />
              </div>


              <div className="flex space-x-3">
                <button
                  type="button"
                  className={primaryButtonStyle + " flex-1"}
                  onClick={handleSubmit}
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTournamentModal(false);
                    setShowQuestionsFrame(false);
                  }}
                  className={secondaryButtonStyle + " flex-1"}
                >
                  Cancel
                </button>
              </div>
              {isEditing && (
                <>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!showQuestionsFrame) await fetchQuestions(currentTournament.tournament_id);
                        setShowQuestionsFrame(!showQuestionsFrame);
                      }}
                      className="w-full bg-accent hover:bg-accent-focus text-accent-content px-4 py-2 rounded-md transition-colors"
                    >
                      {showQuestionsFrame ? "Hide Questions" : "Show Questions"}
                    </button>
                  </div>

                  {showQuestionsFrame && (
                    <div className="mt-4 space-y-4">
                      {isLoadingQuestions ? (
                        <p>Loading questions...</p>
                      ) : (
                        <>
                          {questions.map((q) => (
                            <div key={q.question_id} className="bg-base-300 p-4 rounded-lg space-y-2">
                              <div className="font-bold">{q.content}</div>
                              <div className="text-sm text-base-content/70">
                                Language: {q.language} | Topic: {q.topic} | Difficulty: {q.difficulty}
                              </div>
                              <div className="flex gap-4">
                                <button
                                  type='button'
                                  className="text-blue-600 hover:underline"
                                  onClick={() => {
                                    setCurrentTournament({
                                      ...currentTournament,
                                      content: q.content,
                                      language: q.language,
                                      topic: q.topic,
                                      difficulty: q.difficulty,
                                      test_inputs: q.test_inputs,
                                      expected_outputs: q.expected_outputs,
                                      question_id: q.question_id,
                                    });
                                    notify("Question loaded into form for editing.");
                                  }}
                                >
                                  Update
                                </button>
                                <button
                                  type='button'
                                  className="text-red-600 hover:underline"
                                  onClick={() => handleDeleteQuestion(q.question_id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* 👉 Formulario al final para agregar o actualizar */}
                          {renderQuestionForm()}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading tournaments...</p>
        ) : (
          tournaments.map((tournament) => (
            <motion.div
              key={tournament.tournament_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-base-200 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-2 text-base-content">{tournament.name}</h3>
              <p className="text-base-content/60 text-sm mb-4">{tournament.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/60">
                  Date limit: {new Date(tournament.date_limit).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </span>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleEdit(tournament)}
                    className={linkButtonStyle}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tournament.tournament_id)}
                    className={linkButtonStyle}
                  >
                    Delete
                  </button>
                </div>
              </div>

            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentManagement; 