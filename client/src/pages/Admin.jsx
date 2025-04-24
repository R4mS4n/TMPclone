import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar.jsx";
import {verifyAdminStatus} from '../utils/adminHelper.js';


export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTournaments, setShowTournaments] = useState(false);

  const [activeTab, setActiveTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament]=useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    time_limit: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setIsLoading(true);
        const isUserAdmin = await verifyAdminStatus();
        
        if (isUserAdmin) {
          setIsAdmin(true);
        } else {
          navigate('/login', { replace: true }); // Redirect non-admins to home
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  const fetchTournaments = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tournaments");
      if (!response.ok) throw new Error("Failed to fetch tournaments");
      const data = await response.json();
      console.log(data);
      setTournaments(data);
      setShowTournaments(true);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    }
  };

  const [editingId, setEditingId] = useState(null); // Track which tournament is being edited
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    time_limit: ''
  });

  const handleEditClick = (tournament) => {
    if (editingId === tournament.tournament_id) {
      setEditingId(null);
    } else {
      setEditingId(tournament.tournament_id);
      setEditForm({
        name: tournament.name,
        description: tournament.description || '',
        time_limit: tournament.time_limit || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'time_limit' ? parseInt(value) || 0 : value
    }));
  };

  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this tournament and all its data?')) {
    return;
    }
    //console.log(tournamentId);
    try {
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const result=await response.json();
      console.log(result)

      if(!response.ok){
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }
      fetchTournaments();
      setEditingId(null);
      alert(result.message || 'Tournament deleted successfully');
    } catch (error) {
      console.log(error);
      console.error('Delete error:', error);
      alert(error.message || 'Failed to delete tournament');
    }
  };
  
const handleUpdateTournament = async (tournamentId) => {
  try {
    // Get values from your form state (editForm in your case)
    const updateData = {
      name: editForm.name,
      description: editForm.description,
      time_limit: editForm.time_limit
    };

    const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Update failed');
    }

    // Refresh the tournaments list
    await fetchTournaments();
    setEditingId(null); // Close the edit form
    alert('Tournament updated successfully!');

  } catch (error) {
    console.error('Update error:', error);
    alert(`Update failed: ${error.message}`);
  }
};

const handleCreateTournament = async () => {
    try {
      // Basic validation
      if (!newTournament.name || newTournament.time_limit < 0) {
        alert('Name and valid time limit are required');
        return;
      }

      const response = await fetch('http://localhost:5000/api/tournaments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTournament)
      });

      const data = await response.json();
      console.log(data);
      if (!response.ok) throw new Error(data.error || 'Creation failed');

      await fetchTournaments();
      setShowCreateForm(false);
      setNewTournament({ name: '', description: '', time_limit: 0 });
      alert('Tournament created successfully!');

    } catch (error) {
      console.error('Creation error:', error);
      alert(`Creation failed: ${error.message}`);
    }
  };

const getAllUsers = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

  return (
    <div>
      <Navbar />
      
      <div>
        <div>
          <button onClick={fetchTournaments}>
            Edit Tournaments
          </button>
          <button onClick={getAllUsers}>
            Edit Users
          </button>
          <button>
            View User Stats
          </button>
        </div>

        {showTournaments && (
          <div>
            <h2>Tournaments</h2>
            
          
            <div>
              {!showCreateForm ? (
                <button onClick={() => setShowCreateForm(true)}>
                  Create Tournament
                </button>
              ) : (
                <div>
                  <h3>Create New Tournament</h3>
                  
                  <div>
                    <div>
                      <label>Name</label>
                      <input
                        type="text"
                        value={newTournament.name}
                        onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label>Description</label>
                      <textarea
                        value={newTournament.description}
                        onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                        
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label>Time Limit (hours)</label>
                      <input
                        type="number"
                        value={newTournament.time_limit}
                        onChange={(e) => setNewTournament({...newTournament, time_limit: parseInt(e.target.value) || 0})}
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <button
                        onClick={handleCreateTournament}
                        >
                        Submit
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewTournament({ name: '', description: '', time_limit: 0 });
                        }}
                        >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              {tournaments.map((tournament) => (
                <div key={tournament.tournament_id}>
                  <div>
                    <div>
                      <div>{tournament.name}</div>
                    </div>
                    <button 
                      onClick={() => handleEditClick(tournament)}
                    >
                      {editingId === tournament.tournament_id ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {editingId === tournament.tournament_id && (
                    <div>
                      <div>
                        <label>Name</label>
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label>Description</label>
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label>
                          Time Limit (hours)
                        </label>
                        <input
                          type="number"
                          name="time_limit"
                          value={editForm.time_limit}
                          onChange={handleInputChange}
                          min="0"
                          />
                      </div>

                      <div>
                        <button
                    
                          onClick={() => handleDeleteTournament(tournament.tournament_id)}
                        >
                          DELETE CHALLENGE
                        </button>
                        <button
                          onClick={() => handleUpdateTournament(tournament.tournament_id)}
                          >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

}
