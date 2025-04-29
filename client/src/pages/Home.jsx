import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar";
import ThemeTest from "../components/ThemeTest"

const Home = () => {
  const [enrollments, setEnrollments] = useState([]); // Estado para guardar los retos en los que está inscrito el usuario
  const [loading, setLoading] = useState(true);       // Estado para saber si está cargando
  const [error, setError] = useState(null);            // Estado para manejar errores
  const [isBadgesModalOpen, setBadgesModalOpen] = useState(false); // Estado para abrir/cerrar modal
  const navigate = useNavigate();                     // Hook para redirigir páginas

  const openBadgesModal = () => setBadgesModalOpen(true);
  const closeBadgesModal = () => setBadgesModalOpen(false);

  useEffect(() => {
    // Lógica para traer los enrollments del backend (comentada porque ahorita solo trabajas el front)
    /*
    const fetchEnrollments = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Obtener token guardado en localStorage
        if (!token) {
          navigate('/login'); // Si no hay token, redirige a login
          return;
        }

        // Hacer petición al backend para obtener retos inscritos
        const response = await fetch('http://localhost:5000/api/user/enrollments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch enrollments'); // Si hay error, lanzar error

        const data = await response.json(); // Convertir respuesta a JSON
        setEnrollments(data.enrollments || []); // Guardar retos en el estado
      } catch (err) {
        setError(err.message); // Guardar el error si algo falla
      } finally {
        setLoading(false); // Terminar el estado de carga
      }
    };

    fetchEnrollments();
    */
    
    // Para efectos visuales solamente, desactiva loading después de un momento
    setTimeout(() => setLoading(false), 500); // Simula un pequeño tiempo de carga
  }, [navigate]);

  return (
    <>{/* Local CSS */}
    <style>
      {`
        .scroll-hidden::-webkit-scrollbar {
          display: none;
        }
        .scroll-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes slide-text {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-slide {
          display: inline-block;
          animation: slide-text 4s linear infinite;
        }

        .truncate:hover {
          animation-play-state: running;
        }
      `}
    </style>
    <div className="min-h-screen">
      <Navbar />
      <ThemeTest />
      <div className="p-4">
        {/* Mostrar "Loading" mientras loading sea true */}
        {loading && <div className="text-center text-sm">Loading your challenges...</div>}

        {/* Mostrar mensaje de error si hay un error */}
        {error && <div className="text-error text-center">Error: {error}</div>}

        {/* Mostrar el contenido solo si no está cargando y no hay error */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-4rem)]">

            {/* CARD 1 - User Info */}

            <div className="bg-base-200 p-6 rounded-lg shadow-lg row-span-2 h-full flex flex-col items-center">
              {/* Profile Picture */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden">
                  <img
                    src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              {/* Name */}
              <h2 className="text-2xl font-bold text-center mb-2">Jane Doe</h2>

              {/* Level Card */}
              <div className="bg-base-100 p-4 rounded-lg shadow w-full mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-semibold">Level 2</div>
                    <div className="text-xs text-gray-500">500 Points to next level</div>
                  </div>
                </div>
                <div className="relative h-4 bg-yellow-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="absolute top-0 left-0 h-full bg-yellow-400 flex items-center justify-center text-xs text-yellow-800 font-semibold"
                    style={{ width: "86%" }}
                  >
                    ⭐ 5200/6000
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2</span>
                  <span>3</span>
                </div>
              </div>

              {/* Challenges and Leaderboard */}
              <div className="grid grid-cols-2 gap-4 w-full mb-4">
                <div className="bg-base-100 rounded-lg p-3 shadow flex flex-col items-center justify-center">
                  <div className="text-2xl">⚡</div>
                  <div className="font-semibold">55</div>
                  <div className="text-xs text-gray-500">Challenges</div>
                </div>
                <div className="bg-base-100 rounded-lg p-3 shadow flex flex-col items-center justify-center">
                  <div className="text-2xl">📈</div>
                  <div className="font-semibold">#17</div>
                  <div className="text-xs text-gray-500">Leaderboard</div>
                </div>
              </div>

              {/* Badges */}
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-gray-400">Badges 53</h2>
                  <button
                    onClick={openBadgesModal}
                    className="text-primary hover:underline text-sm font-semibold"
                  >
                    Badges &gt;
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-base-100 rounded-lg h-30"></div>
                  <div className="bg-base-100 rounded-lg h-30"></div>
                  <div className="bg-base-100 rounded-lg h-30"></div>
                </div>
              </div>
            </div>

            {/* Modal for Badges */}
            {isBadgesModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
                  <h2 className="text-xl font-bold mb-4">All Badges</h2>
                  <div className="grid grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-base-300 h-16 rounded-lg flex items-center justify-center"
                      >
                        🏅
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={closeBadgesModal}
                      className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/80"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Right Top Row */}
            <div className="col-span-2 grid grid-cols-3 gap-6 h-3/5">

              {/* CARD 2 - CHALLENGES */}

              <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-2 h-3/5">
                <h2 className="text-xl font-bold text-center">Done Recently</h2>
                <p className="text-center text-gray-600">Coming soon...</p>
              </div>

              {/* CARD 3 - Leaderboard */}

              <div className="bg-base-200 p-4 rounded-2xl shadow-lg col-span-1 flex flex-col h-3/5">

                <h2 className="text-xl font-bold text-center mb-4 bg-primary text-base-200 py-2 px-4 rounded-md">
                  Leaderboard
                </h2>
                <div className="flex flex-col gap-2 overflow-y-auto flex-1 scroll-hidden">
                  {[1, 2, 3, 4, 5].map((rank) => {
                    const medalColors = {
                      1: "text-yellow-500",
                      2: "text-gray-400",
                      3: "text-amber-700",
                    };
                    const isTop3 = rank <= 3;
                    const points = 5000 - rank * 200;
                    const username = `User${rank}WithAVeryLongName`; // Example long name

                    return (
                      <div
                        key={rank}
                        className="flex items-center gap-2 bg-base-300 px-2 py-2 rounded-md shadow-sm text-sm"
                      >
                        {/* Trophy / Number */}
                        <div className="w-5 h-5 relative flex items-center justify-center shrink-0">
                          {isTop3 ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className={`w-5 h-5 ${medalColors[rank]}`}
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12 1.69a.494.494 0 0 0-.438-.494 32.352 32.352 0 0 0-7.124 0A.494.494 0 0 0 4 1.689v.567c-.811.104-1.612.24-2.403.406a.75.75 0 0 0-.595.714 4.5 4.5 0 0 0 4.35 4.622A3.99 3.99 0 0 0 7 8.874V10H6a1 1 0 0 0-1 1v2h-.667C3.597 13 3 13.597 3 14.333c0 .368.298.667.667.667h8.666a.667.667 0 0 0 .667-.667c0-.736-.597-1.333-1.333-1.333H11v-2a1 1 0 0 0-1-1H9V8.874a3.99 3.99 0 0 0 1.649-.876 4.5 4.5 0 0 0 4.35-4.622.75.75 0 0 0-.596-.714A30.897 30.897 0 0 0 12 2.256v-.567Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="absolute top-0.5 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-base-content leading-none">
                                {rank}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">{rank}</span>
                          )}
                        </div>

                        {/* User icon */}
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-5-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9c-1.825 0-3.422.977-4.295 2.437A5.49 5.49 0 0 0 8 13.5a5.49 5.49 0 0 0 4.294-2.063A4.997 4.997 0 0 0 8 9Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>

                        
                        {/* Username */}
                        <div className="flex-1 min-w-0">
                          <div className="truncate hover:animate-slide whitespace-nowrap font-medium text-[13px]">
                            {username}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="w-[64px] text-right font-semibold text-[13px]">
                          {points} pts
                        </div>
                      </div>

                    );
                  })}

                  {/* You row */}
                  <div className="flex items-center gap-2 bg-error/50 px-2 py-2 rounded-md shadow-sm text-sm font-semibold text-base-content">
                    <div className="w-6 h-6 shrink-0" />
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-5-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9c-1.825 0-3.422.977-4.295 2.437A5.49 5.49 0 0 0 8 13.5a5.49 5.49 0 0 0 4.294-2.063A4.997 4.997 0 0 0 8 9Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="truncate hover:animate-slide whitespace-nowrap">
                          You
                        </div>
                      </div>
                      <div className="shrink-0 text-right">2740 pts</div>
                    </div>
                  </div>

                  {/* Dots */}
                  <div
                    onClick={() => (window.location.href = "/leaderboard")}
                    className="text-center text-gray-400 hover:text-primary cursor-pointer mt-1 text-2xl font-bold"
                  >
                    ...
                  </div>
                </div>
              </div>

              {/* CARD 4 - Daily Challenge (?) */}
              <div className="col-span-3 bg-base-200 p-6 rounded-lg shadow-lg h-full">
                <h2 className="text-xl font-bold text-center">Daily Challenge</h2>
                <p className="text-center text-gray-600">Coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Home;
