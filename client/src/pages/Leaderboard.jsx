import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Leaderboard = () => {
  const { isDark } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('honor');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState(0);
  const [honorLeaderboard, setHonorLeaderboard] = useState([]);
  const [honorLeaderboardLoading, setHonorLeaderboardLoading] = useState(true);

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
        
        const [hours, minutes, seconds] = prevTime.split(':').map(Number);
        let totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        if (totalSeconds <= 0) {
          clearInterval(timer);
          return '00:00:00';
        }
        
        totalSeconds -= 1;
        const newHours = Math.floor(totalSeconds / 3600);
        const newMinutes = Math.floor((totalSeconds % 3600) / 60);
        const newSeconds = totalSeconds % 60;
        
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch honor leaderboard data
  useEffect(() => {
    if (selectedTab === 'honor') {
      fetchHonorLeaderboard();
    } else if (selectedTab === 'all' || selectedTab === 'teams') {
      // When switching to non-honor tabs, make sure to fetch data if we have a selected tournament
      if (selectedTournament) {
        fetchLeaderboardData(selectedTournament);
      }
    }
  }, [selectedTab]);

  const fetchHonorLeaderboard = async () => {
    try {
      setHonorLeaderboardLoading(true);
      // Also set the regular loading state to false to avoid loading spinner conflicts
      setLoading(false);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/user/honor-leaderboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch honor leaderboard');
      }
      
      const data = await response.json();
      console.log('Honor leaderboard data:', data);
      
      if (data.success && data.leaderboard) {
        // Transform the data to match the leaderboard format
        const formattedData = data.leaderboard.map((user, index) => ({
          user_id: user.user_id,
          username: user.username,
          profile_pic: user.profile_pic,
          score: user.honor_points, // Use honor_points as the score
          position: index + 1,
          // Add default values for other fields
          level: 1,
          xp: 0,
          achievements: 0
        }));
        
        setHonorLeaderboard(formattedData);
        setParticipants(formattedData.length);
      } else {
        setHonorLeaderboard([]);
      }
    } catch (err) {
      console.error('Error fetching honor leaderboard:', err);
      setError('Failed to fetch honor leaderboard');
    } finally {
      setHonorLeaderboardLoading(false);
    }
  };

  const fetchLeaderboardData = async (tournamentId) => {
    setLoading(true);
    // Also reset the honor loading state to avoid conflicts
    setHonorLeaderboardLoading(false);
    try {
      const token = localStorage.getItem('authToken');
      
      // First approach: Check if we have official leaderboard entries
      const leaderboardResponse = await fetch(`http://localhost:5000/api/leaderboard?tournament_id=${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If we have official leaderboard entries, use them
      if (leaderboardResponse.ok) {
        const leaderboardResults = await leaderboardResponse.json();
        
        if (leaderboardResults && leaderboardResults.length > 0) {
          // The leaderboard table already has position and username
          setLeaderboardData(leaderboardResults.map(entry => ({
            ...entry,
            // Format to ensure we have all required fields
            leaderboard_id: entry.leaderboard_id,
            user_id: entry.user_id,
            username: entry.username,
            tournament_id: entry.tournament_id,
            position: entry.position,
            // These might need to come from user table if not in leaderboard
            score: entry.score || 0,
            achievements: entry.achievements || 0,
            level: entry.level || 1,
            xp: entry.xp || 0
          })));
          
          setParticipants(leaderboardResults.length);
          setLoading(false);
          return;
        }
      }
      
      // Second approach: If no official leaderboard, build from Tournament_Participation
      const participationResponse = await fetch(`http://localhost:5000/api/tournament-participation?tournament_id=${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!participationResponse.ok) {
        throw new Error('Failed to fetch tournament participation data');
      }
      
      const participationData = await participationResponse.json();
      setParticipants(participationData.length);
      
      if (participationData.length === 0) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }
      
      // Get user details including username, level, xp
      const usersResponse = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const usersData = await usersResponse.json();
      
      // Get user achievements
      const achievementsResponse = await fetch('http://localhost:5000/api/user-achievements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let achievementsData = [];
      if (achievementsResponse.ok) {
        achievementsData = await achievementsResponse.json();
      }
      
      // Build the leaderboard by combining data
      const combinedData = participationData.map(participant => {
        const user = usersData.find(u => u.user_id === participant.user_id) || {};
        const userAchievements = achievementsData.filter(a => a.user_id === participant.user_id) || [];
        
        return {
          user_id: participant.user_id,
          username: user.username || `User ${participant.user_id}`,
          tournament_id: participant.tournament_id,
          score: participant.score || 0,
          // Include additional user info if available
          level: user.level || 1,
          xp: user.xp || 0,
          achievements: userAchievements.length || 0,
          team_id: user.team_id || null
        };
      });
      
      // Sort by score (descending)
      combinedData.sort((a, b) => b.score - a.score);
      
      // Add position field after sorting
      const rankedData = combinedData.map((item, index) => ({
        ...item,
        position: index + 1
      }));
      
      setLeaderboardData(rankedData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data');
      setLoading(false);
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        setLeaderboardData(mockLeaderboardData);
        setParticipants(mockLeaderboardData.length);
        setLoading(false);
        setError(null);
      }
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
    // Set the selected tab
    setSelectedTab(tab);
    
    // The useEffect will handle the data loading based on selected tab
  };

  const filterLeaderboardData = () => {
    // Filter data based on selected tab
    if (selectedTab === 'honor') {
      return honorLeaderboardLoading ? [] : honorLeaderboard;
    } else if (selectedTab === 'teams') {
      // Group by team_id and sum scores
      const teamScores = new Map();
      
      leaderboardData.forEach(user => {
        if (user.team_id) {
          if (!teamScores.has(user.team_id)) {
            teamScores.set(user.team_id, {
              team_id: user.team_id,
              team_name: user.team_name || `Team ${user.team_id}`,
              score: 0,
              members: 0,
              achievements: 0
            });
          }
          
          const team = teamScores.get(user.team_id);
          team.score += user.score;
          team.members += 1;
          team.achievements += user.achievements || 0;
        }
      });
      
      // Convert to array and sort
      const teamsArray = Array.from(teamScores.values());
      teamsArray.sort((a, b) => b.score - a.score);
      
      // Add position
      return teamsArray.map((team, index) => ({
        ...team,
        position: index + 1,
        username: team.team_name // Use team name as username for display
      }));
    }
    
    return leaderboardData;
  };

  // Mock data for development fallback
  const mockLeaderboardData = [
    { user_id: 101, username: 'Jake Peralta', tournament_id: 20, score: 1098, position: 1, level: 5, xp: 570, achievements: 8, team_id: 1, team_name: 'Brooklyn 99' },
    { user_id: 102, username: 'Monica C. Geller', tournament_id: 20, score: 1036, position: 2, level: 4, xp: 490, achievements: 7, team_id: 2, team_name: 'Friends' },
    { user_id: 103, username: 'Anette F. Lerroy', tournament_id: 20, score: 967, position: 3, level: 4, xp: 420, achievements: 6, team_id: 3, team_name: 'CodeMasters' },
    { user_id: 104, username: 'Luke S. Anderson', tournament_id: 20, score: 885, position: 4, level: 3, xp: 380, achievements: 5, team_id: 3, team_name: 'CodeMasters' },
    { user_id: 105, username: 'Robin Scherbatsky', tournament_id: 20, score: 872, position: 5, level: 3, xp: 350, achievements: 5, team_id: 4, team_name: 'HIMYM' },
    { user_id: 106, username: 'Ted Mosby', tournament_id: 20, score: 843, position: 6, level: 3, xp: 320, achievements: 4, team_id: 4, team_name: 'HIMYM' },
    { user_id: 107, username: 'Marshall Eriksen', tournament_id: 20, score: 791, position: 7, level: 3, xp: 290, achievements: 4, team_id: 4, team_name: 'HIMYM' },
    { user_id: 108, username: 'Lily Aldrin', tournament_id: 20, score: 768, position: 8, level: 2, xp: 260, achievements: 3, team_id: 4, team_name: 'HIMYM' },
    { user_id: 109, username: 'Barney Stinson', tournament_id: 20, score: 720, position: 9, level: 2, xp: 230, achievements: 3, team_id: 4, team_name: 'HIMYM' },
    { user_id: 110, username: 'Rachel Green', tournament_id: 20, score: 695, position: 10, level: 2, xp: 200, achievements: 2, team_id: 2, team_name: 'Friends' },
  ];

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
  const renderLevel = (level, xp) => {
    return (
      <div className="flex items-center">
        <div className="badge badge-primary mr-1">Lvl {level}</div>
        <span className="text-xs text-gray-500">{xp} XP</span>
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
  const isHonorTab = selectedTab === 'honor';
  const isLoading = isHonorTab ? honorLeaderboardLoading : loading;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className={`card ${isDark ? 'bg-base-200' : 'bg-base-100'} shadow-xl`}>
        <div className="card-body p-4 md:p-6">
          {/* Header section with tournament selector */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
              <h2 className="card-title text-2xl md:text-3xl font-bold text-primary">Leaderboard</h2>
              
              {!isHonorTab && tournaments.length > 0 && (
                <div className="mt-2">
                  <div className="relative">
                    <select 
                      className="w-full max-w-xs px-4 py-2 h-10 bg-base-300 rounded-md border-none appearance-none cursor-pointer text-base-content"
                      style={{ 
                        backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
                        backgroundPosition: "right 0.5rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1.5em 1.5em",
                        paddingRight: "2.5rem"
                      }}
                      value={selectedTournament || ''}
                      onChange={(e) => handleTournamentChange(e.target.value)}
                    >
                      {tournaments.map(tournament => (
                        <option key={tournament.tournament_id} value={tournament.tournament_id}>
                          {tournament.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-3 md:flex-row mt-4 md:mt-0">
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-500">Participants</span>
                <span className="font-bold text-lg text-primary">{participants}</span>
              </div>
              
              {timeRemaining && !isHonorTab && (
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500">Time Remaining</span>
                  <span className="text-xl md:text-2xl font-bold text-primary">{timeRemaining}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Prizes section - show for all tabs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="text-sm text-gray-500">1st Prize</div>
              <div className={`h-20 w-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg shadow-inner`}></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm text-gray-500">2nd Prize</div>
              <div className={`h-20 w-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg shadow-inner`}></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm text-gray-500">3rd Prize</div>
              <div className={`h-20 w-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg shadow-inner`}></div>
            </div>
          </div>

          {/* Filter tabs in a rounded rectangle box */}
          <div className="flex justify-center mb-6">
            <div className="bg-base-300 rounded-lg p-1 inline-flex">
              <button 
                className={`px-4 py-2 rounded-md transition-colors ${selectedTab === 'honor' ? 'bg-primary text-white' : 'hover:bg-base-200'}`}
                onClick={() => handleTabChange('honor')}
              >
                Honor
              </button>
              <button 
                className={`px-4 py-2 rounded-md transition-colors ${selectedTab === 'all' ? 'bg-primary text-white' : 'hover:bg-base-200'}`}
                onClick={() => handleTabChange('all')}
              >
                All
              </button>
              <button 
                className={`px-4 py-2 rounded-md transition-colors ${selectedTab === 'teams' ? 'bg-primary text-white' : 'hover:bg-base-200'}`}
                onClick={() => handleTabChange('teams')}
              >
                Teams
              </button>
            </div>
          </div>

          {/* No data message */}
          {!isLoading && !error && displayData.length === 0 && (
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{isHonorTab ? 'No honor data available yet.' : 'No participants found for this tournament yet.'}</span>
            </div>
          )}

          {/* Leaderboard table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : error ? (
            <div className="alert alert-error">
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
                    <th>{selectedTab === 'teams' ? 'Team' : 'Username'}</th>
                    <th>{isHonorTab ? 'Honor Points' : 'Level'}</th>
                    {!isHonorTab && <th>Achievements</th>}
                    <th className="text-right">{isHonorTab ? 'Honor' : 'Score'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((entry) => (
                    <tr 
                      key={selectedTab === 'teams' ? `team-${entry.team_id}` : `user-${entry.user_id}-${entry.tournament_id || 'honor'}`} 
                      className={`${entry.position <= 3 ? 'font-semibold' : ''}`}
                    >
                      <td className="text-center">{renderRank(entry.position)}</td>
                      <td className="text-center">
                        <div className="avatar">
                          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                            {entry.profile_pic ? (
                              <img src={entry.profile_pic} alt={entry.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {entry.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{entry.username}</td>
                      <td>
                        {isHonorTab ? (
                          <span className="font-semibold">{entry.score} points</span>
                        ) : (
                          <>
                            {selectedTab !== 'teams' && entry.level && renderLevel(entry.level, entry.xp)}
                            {selectedTab === 'teams' && <span className="badge badge-secondary">{entry.members} members</span>}
                          </>
                        )}
                      </td>
                      {!isHonorTab && <td>{renderAchievements(entry.achievements || 0)}</td>}
                      <td className="text-right font-bold text-primary">{entry.score}</td>
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