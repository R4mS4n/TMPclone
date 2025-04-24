import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar.jsx";
import {verifyAdminStatus} from '../utils/adminHelper.js';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTournaments, setShowTournaments] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament]=useState(null);
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
      setTournaments(data);
      setShowTournaments(true);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    }
  };

  const handleEditTournament = (tournamentId) => {
    // Implement your edit logic here
    console.log("Editing tournament:", tournamentId);
    // navigate(`/edit-tournament/${tournamentId}`);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading admin privileges...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div>
      <Navbar />
      
      <div className="flex">
        <div className="p-2 space-y-2 border-r">
          <button 
            className="block w-full p-2 text-left"
            onClick={fetchTournaments}
          >
            Edit Tournaments
          </button>
          <button className="block w-full p-2 text-left">Edit Users</button>
          <button className="block w-full p-2 text-left">User Statistics</button>
        </div>

        <div className="p-4">
          {showTournaments && (
            <div>
              <h2 className="text-xl font-bold mb-4">Tournaments</h2>
              <div className="space-y-2">
                {tournaments.map((tournament) => (
                  <div key={tournament.tournament_id} className="flex items-center justify-between p-2 border-b">
                    <span>{tournament.name}</span>
                    <button 
                      onClick={() => handleEditTournament(tournament.tournament_id)}
                      className="p-1 bg-blue-100 hover:bg-blue-200"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
