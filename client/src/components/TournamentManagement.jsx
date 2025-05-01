import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';

const TournamentManagement = () => {
  const [tournaments, setTournaments] = useState([]);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTournament, setCurrentTournament] = useState({
    name: '',
    description: '',
    time_limit: ''
  });
  const [loading, setLoading] = useState(true);
  const { notify, notifySuccess, notifyError, confirm } = useNotification();

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
      const response = await fetch('http://localhost:5000/api/tournaments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      const data = await response.json();
      setTournaments(data);
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
          const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to delete tournament');
          }

          await fetchTournaments();
        } catch (error) {
          console.error('Error deleting tournament:', error);
          notifyError(error.message);
        }
      }
    );
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentTournament({
      name: '',
      description: '',
      time_limit: ''
    });
    setShowTournamentModal(true);
  };

  const handleSubmit = async () => {
    console.log('Submitting form:', { isEditing, currentTournament });
    
    try {
      const url = isEditing 
        ? `http://localhost:5000/api/tournaments/${currentTournament.tournament_id}` 
        : 'http://localhost:5000/api/tournaments';

      const method = isEditing ? 'PUT' : 'POST';
      
      console.log(`Making ${method} request to ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(currentTournament)
      });

      let responseData;
      try {
        responseData = await response.json();
        console.log('Response:', responseData);
      } catch (jsonError) {
        console.error('Error parsing response:', jsonError);
      }

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
      console.log('Tournaments refreshed');
      setShowTournamentModal(false);
      setCurrentTournament({ name: '', description: '', time_limit: '' });
    } catch (error) {
      console.error('Error submitting tournament:', error);
      notifyError(error.message);
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
            className="fixed right-0 top-0 w-1/3 h-full bg-base-100 shadow-lg p-6 z-50"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Tournament' : 'New Tournament'}</h2>
              <button
                onClick={() => setShowTournamentModal(false)}
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
                  <span className="label-text text-base-content">Time Limit (hours)</span>
                </label>
                <input
                  type="number"
                  value={currentTournament.time_limit}
                  onChange={(e) => setCurrentTournament({ ...currentTournament, time_limit: e.target.value })}
                  className="w-full rounded-lg bg-base-200 text-base-content px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Write in Hours"
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
                  onClick={() => setShowTournamentModal(false)}
                  className={secondaryButtonStyle + " flex-1"}
                >
                  Cancel
                </button>
              </div>
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
                <span className="text-sm text-base-content/60">Time limit: {tournament.time_limit}h</span>
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