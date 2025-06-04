import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import UserAvatar from '../components/UserAvatar';
import SearchableDropdown from '../components/SearchableDropdown';

const Leaderboard = () => {
  const { isDark } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState(0);
  const [top10Leaderboard, setTop10Leaderboard] = useState([]);
  const [top10Loading, setTop10Loading] = useState(true);
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState([]);
  const [tournamentLoading, setTournamentLoading] = useState(true);

  useEffect(() => {
    // Fetch tournaments first
    const fetchTournaments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:5000/api/tournaments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        
        const data = await response.json();
        setTournaments(data);
        
        // Select the first tournament by default if available
        if (data.length > 0) {
          const firstTournament = data[0];
          setSelectedTournament(firstTournament.tournament_id);
          
          // Set time remaining based on tournament date_limit
          if (firstTournament.date_limit) {
            const now = new Date();
            const deadline = new Date(firstTournament.date_limit);

             const timeDifference = deadline - now; // Diferencia en milisegundos

              if (timeDifference > 0) {
                const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
                const seconds = Math.floor((timeDifference / 1000) % 60);

                setTimeRemaining(
                  `${days}d ${hours.toString().padStart(2, '0')}:${minutes
                  .toString()
                  .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
              } else {
              setTimeRemaining("00d 00:00:00"); // Si el tiempo ya pasó
            }
          }
          
          fetchLeaderboardData(firstTournament.tournament_id);
          fetchTop10Leaderboard();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('Failed to load tournaments');
        setLoading(false);
        
        // Fallback to mock tournament for development
        if (process.env.NODE_ENV === 'development') {
          const mockTournament = { 
            tournament_id: 20, 
            name: 'Mock Tournament',
            date_limit: '2025-12-31 23:59:59' // end fo year
          };
          setTournaments([mockTournament]);
          setSelectedTournament(mockTournament.tournament_id);
          if (timeDifference > 0) {
            const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
            const seconds = Math.floor((timeDifference / 1000) % 60);

            setTimeRemaining(
              `${days}d ${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
          } else {
            setTimeRemaining("00d 00:00:00"); // Si el tiempo ya pasó
          }
          fetchLeaderboardData(mockTournament.tournament_id);
        }
      }
    };

    fetchTournaments();
    
    // Optional: Real-time countdown implementation
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (!prevTime) return prevTime;

        let currentTotalSeconds = 0;

        if (prevTime.includes('d ')) { // Ensure space after 'd' for reliable split
            const mainParts = prevTime.split('d ');
            if (mainParts.length < 2 || !mainParts[1] || !mainParts[1].includes(':')) {
                clearInterval(timer);
                return '00:00:00'; 
            }
            const d = parseInt(mainParts[0], 10);
            const timeStr = mainParts[1];
            const timeParts = timeStr.split(':').map(Number);

            if (isNaN(d) || timeParts.length !== 3 || timeParts.some(isNaN)) {
                clearInterval(timer);
                return '00:00:00';
            }
            currentTotalSeconds = d * 86400 + timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        } else if (prevTime.includes(':')) { // Assumes HH:MM:SS or 00:00:00
            const timeParts = prevTime.split(':').map(Number);
            if (timeParts.length === 3 && !timeParts.some(isNaN)) {
                currentTotalSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            } else { 
                clearInterval(timer);
                return '00:00:00';
            }
        } else { 
            clearInterval(timer);
            return '00:00:00';
        }
        
        if (isNaN(currentTotalSeconds)) { 
            clearInterval(timer);
            return '00:00:00';
        }

        if (currentTotalSeconds <= 0) {
          // clearInterval(timer); // Removed: Do not stop the interval, just display 0
          return '00:00:00';
        }
        
        currentTotalSeconds -= 1;
        
        const newDays = Math.floor(currentTotalSeconds / 86400);
        const remainingSecondsAfterDays = currentTotalSeconds % 86400;
        const newHours = Math.floor(remainingSecondsAfterDays / 3600);
        const remainingSecondsAfterHours = remainingSecondsAfterDays % 3600;
        const newMinutes = Math.floor(remainingSecondsAfterHours / 60);
        const newSeconds = remainingSecondsAfterHours % 60;
        
        if (newDays > 0) {
          return `${newDays}d ${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
        } else {
          return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
        }
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchTop10Leaderboard = async () => {
    try {
      setTop10Loading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/leaderboard/10leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch top 10 leaderboard');
      
      const data = await response.json();
      // Add positions to the data
      const dataWithPositions = data.map((item, index) => ({
        ...item,
        position: index + 1
      }));
      setTop10Leaderboard(dataWithPositions);
    } catch (err) {
      console.error('Error fetching top 10 leaderboard:', err);
      setError('Failed to load top 10 leaderboard');
    } finally {
      setTop10Loading(false);
    }
  };

  const fetchLeaderboardData = async (tournamentId) => {
    setTournamentLoading(true);
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch tournament leaderboard data
      const response = await fetch(`http://localhost:5000/api/leaderboard/top10ByTournament?tournament_id=${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });


      if (!response.ok) {
        throw new Error('Failed to fetch tournament leaderboard');
      }

      const data = await response.json();
      console.log(data);
      // Transform the data to match our format
      const formattedData = data.map((entry, index) => ({
        user_id: entry.user_id,
        username: entry.username,
        level: entry.level,
        xp: entry.xp,
        score: entry.score,
        achievements: 0,
        tournament_id: tournamentId,
        position: index + 1
      }));


      setLeaderboardData(formattedData);
      setParticipants(formattedData.length);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tournament leaderboard:', err);
      setError('Failed to load tournament leaderboard');
      setLoading(false);
      
      // Fallback to mock data for development
      // if (process.env.NODE_ENV === 'development') {
      //   setLeaderboardData(mockLeaderboardData);
      //   setParticipants(mockLeaderboardData.length);
      //   setLoading(false);
      //   setError(null);
      // }
    } finally {
    setTournamentLoading(false);
  }
  };

  const handleTournamentChange = (tournamentId) => {
    setSelectedTournament(tournamentId);
    
    // Update time remaining based on the selected tournament
    const tournament = tournaments.find(t => t.tournament_id === Number(tournamentId));
    if (tournament && tournament.date_limit) {
      const now = new Date();
      const deadline = new Date(tournament.date_limit);
      const timeDifference = deadline - now;

      if (timeDifference > 0) {
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
        const seconds = Math.floor((timeDifference / 1000) % 60);

        setTimeRemaining(
          `${days > 0 ? `${days}d ` : ""}${hours
            .toString()
            .padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
        setTimeRemaining("00:00:00"); // Si el tiempo ya pasó
      }
    }

    
    fetchLeaderboardData(tournamentId);
  };

  // Add a dedicated tab changing handler
  const handleTabChange = (tab) => {
    setSelectedTab(tab);

    if (tab === 'all') {
      setLeaderboardData([]); // clear tournament
      fetchTop10Leaderboard();
    }

    if (tab === 'Tournaments') {
      setTop10Leaderboard([]); // clear global
      if (selectedTournament) {
        fetchLeaderboardData(selectedTournament);
      }
    }
  };


  const filterLeaderboardData = () => {
    if (selectedTab === 'all') {
      return top10Leaderboard;
    }

    if (selectedTab === 'Tournaments') {
      return leaderboardData;
    }

    return [];
  };




  // Mock data for development fallback
  // const mockLeaderboardData = [
  //   { user_id: 101, username: 'Jake Peralta', tournament_id: 20, score: 1098, position: 1, level: 5, xp: 570, achievements: 8 },
  //   { user_id: 102, username: 'Monica C. Geller', tournament_id: 20, score: 1036, position: 2, level: 4, xp: 490, achievements: 7 },
  //   { user_id: 103, username: 'Anette F. Lerroy', tournament_id: 20, score: 967, position: 3, level: 4, xp: 420, achievements: 6 },
  //   { user_id: 104, username: 'Luke S. Anderson', tournament_id: 20, score: 885, position: 4, level: 3, xp: 380, achievements: 5 },
  //   { user_id: 105, username: 'Robin Scherbatsky', tournament_id: 20, score: 872, position: 5, level: 3, xp: 350, achievements: 5 },
  //   { user_id: 106, username: 'Ted Mosby', tournament_id: 20, score: 843, position: 6, level: 3, xp: 320, achievements: 4 },
  //   { user_id: 107, username: 'Marshall Eriksen', tournament_id: 20, score: 791, position: 7, level: 3, xp: 290, achievements: 4 },
  //   { user_id: 108, username: 'Lily Aldrin', tournament_id: 20, score: 768, position: 8, level: 2, xp: 260, achievements: 3 },
  //   { user_id: 109, username: 'Barney Stinson', tournament_id: 20, score: 720, position: 9, level: 2, xp: 230, achievements: 3 },
  //   { user_id: 110, username: 'Rachel Green', tournament_id: 20, score: 695, position: 10, level: 2, xp: 200, achievements: 2 },
  // ];

  // Badge rendering helper
  const renderAchievements = (count) => {
    const badgeColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    return (
      <div className="flex -space-x-2">
        {Array(Math.min(count, 5)).fill().map((_, i) => (
          <div 
            key={i} 
            className={`w-6 h-6 rounded-full ${badgeColors[i % badgeColors.length]} flex items-center justify-center text-white text-xs border-2 border-white`}
          >
            {i + 1}
          </div>
        ))}
        {count > 5 && (
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs border-2 border-white">
            +{count - 5}
          </div>
        )}
      </div>
    );
  };

  // Level indicator
  const renderLevel = (xp) => {
    const level = Math.floor(xp/500);
    return (
      <div className="flex items-center">
        <div className="badge badge-primary mr-1">{level}</div>

      </div>
    );
  };

  // Rank rendering helper (icons for top 3)
  const renderRank = (position) => {
    if (position === 1) {
      return <div className="text-xl text-yellow-500">🏆</div>;
    } else if (position === 2) {
      return <div className="text-xl text-gray-400">🥈</div>;
    } else if (position === 3) {
      return <div className="text-xl text-amber-700">🥉</div>;
    } else {
      return <div className="text-lg font-bold">{position}</div>;
    }
  };

  // Get filtered and processed data to display
  const displayData = filterLeaderboardData();
  const isLoading = 
    selectedTab === 'all' ? top10Loading :
    tournamentLoading;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className={`card ${isDark ? 'bg-base-200' : 'bg-base-100'} shadow-xl rounded-md`}>
        <div className="card-body p-4 md:p-6">
          {/* Header section with tournament selector */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
              <h2 className="card-title text-2xl md:text-3xl font-bold text-primary">Leaderboard</h2>
              
              {selectedTab === 'Tournaments' && tournaments.length > 0 && (

                <div className="mt-2">
                  <SearchableDropdown
                    options={tournaments.map(tournament => ({ label: tournament.name, value: tournament.tournament_id }))}
                    value={selectedTournament}
                    onChange={(value) => handleTournamentChange(value)}
                    placeholder="Search Tournaments..."
                  />
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-3 md:flex-row mt-4 md:mt-0">
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-500">Participants</span>
                <span className="font-bold text-lg text-primary">{participants}</span>
              </div>
              
              {selectedTab === 'Tournaments' && timeRemaining && (
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500">Time Remaining</span>
                  <span className="text-xl md:text-2xl font-bold text-primary">{timeRemaining}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Filter tabs in a rounded rectangle box */}
          <div className="flex justify-center mb-6">
            <div className="bg-base-300 rounded-lg p-1 inline-flex">
              <button 
                className={`px-4 py-2 rounded-md transition-colors ${selectedTab === 'all' ? 'bg-primary text-white' : 'hover:bg-base-200'}`}
                onClick={() => handleTabChange('all')}
              >
                Global
              </button>
              <button 
                className={`px-4 py-2 rounded-md transition-colors ${selectedTab === 'Tournaments' ? 'bg-primary text-white' : 'hover:bg-base-200'}`}
                onClick={() => handleTabChange('Tournaments')}
              >
                Tournaments
              </button>
            </div>
          </div>

          {/* No data message */}
          {!isLoading && !error && displayData.length === 0 && (
            <div className="alert alert-info rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{'No participants found for this tournament yet.'}</span>
            </div>
          )}

          {/* Leaderboard table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : error ? (
            <div className="alert alert-error rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          ) : displayData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="text-center">Position</th>
                    <th className="text-center">Avatar</th>
                    <th>Username</th>
                    <th>{'Level'}</th>
                    <th>Achievements</th>
                    <th className="text-right">
                      {selectedTab === 'all' ? 'Score' : 'Score'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((entry) => (
                    <tr
                      key={`user-${entry.user_id}-tournament-${entry.tournament_id || (selectedTournament || 'global')}`}
                      className={`${entry.position <= 3 ? 'font-semibold' : ''}`}
                    >
                      <td className="text-center">{renderRank(entry.position)}</td>
                      
                      <td className="text-center">
                        <UserAvatar 
                          userId={entry.user_id} 
                          size="sm" // or 'md', 'lg', 'xl' as needed
                          className="mx-auto" // additional classes if needed
                        />
                      </td>
                      <td>{entry.username}</td>
                      <td>
                        {selectedTab === 'all' ? (
                          renderLevel(entry.xp)
                        ) : (
                          <>
                            {selectedTab !== 'Tournaments' && entry.xp && renderLevel(entry.xp)}
                          </>
                        )}
                      </td>
                      <td>{renderAchievements(entry.achievements || 0)}</td>
                      <td className="text-right font-bold text-primary">
                        {selectedTab === 'all' ? entry.xp : entry.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          
          {/* Pagination */}
          {displayData.length > 0 && (
            <div className="flex justify-center mt-6">
              <div className="join">
                <button className="join-item btn btn-sm">«</button>
                <button className="join-item btn btn-sm">Page 1</button>
                <button className="join-item btn btn-sm">»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
