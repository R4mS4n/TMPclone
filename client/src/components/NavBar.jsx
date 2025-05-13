import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import fondo from "../cimages/TMw-logo.png"; // Asegúrate de que la ruta de la imagen esté bien
import { useTheme } from "../contexts/ThemeContext";
import { verifyAdminStatus } from "../utils/adminHelper";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "TMPdark";
  const [isAdmin, setIsAdmin] = useState(false);

  // State para manejar la expansión de la sección "Settings"
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { isAdmin } = await verifyAdminStatus();
        setIsAdmin(isAdmin);
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };
    checkAdminStatus();
  }, []);

  // Función para obtener la clase activa para los enlaces de navegación
  const getActiveClass = (path) => {
    return location.pathname === path 
      ? "font-bold border-b-2 border-white" 
      : "";
  };

  // Función para manejar el logout
  const handleLogout = () => {
    // Eliminar el token de autenticación del localStorage
    localStorage.removeItem("authToken");
    // Redireccionar al usuario a la página de login
    navigate("/login");
  };

  return (
    <div className={`navbar ${isDark ? 'bg-red-900' : 'bg-primary'} shadow-lg transition-colors duration-300`}>
      <div className="navbar-start">
        {/* Logo en la izquierda */}
        <div className="flex items-center ml-2">
          <img
            src={fondo}
            alt="Logo"
            className="w-35 h-10 mr-2"
          />
        </div>

        {/* Botón de menú para móvil */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className={`menu menu-sm dropdown-content ${isDark ? 'bg-red-950' : 'bg-base-100'} rounded-box z-10 mt-3 w-52 p-2 shadow`}
          >
            <li><Link to="/Challenges" className={`${isDark ? 'text-white hover:bg-red-800' : 'text-primary hover:bg-gray-100'} py-2 px-3 rounded-md transition-colors ${getActiveClass('/Challenges')}`}>Challenges</Link></li>
            <li><Link to="/Leaderboard" className={`${isDark ? 'text-white hover:bg-red-800' : 'text-primary hover:bg-gray-100'} py-2 px-3 rounded-md transition-colors ${getActiveClass('/Leaderboard')}`}>Leaderboard</Link></li>
            <li><Link to="/Blog" className={`${isDark ? 'text-white hover:bg-red-800' : 'text-primary hover:bg-gray-100'} py-2 px-3 rounded-md transition-colors ${getActiveClass('/Blog')}`}>Blog</Link></li>
            <li><Link to="/Home" className={`${isDark ? 'text-white hover:bg-red-800' : 'text-primary hover:bg-gray-100'} py-2 px-3 rounded-md transition-colors ${getActiveClass('/Home')}`}>Profile</Link></li>
            {isAdmin && (
              <li><Link to="/admin/tournaments" className={`${isDark ? 'text-white hover:bg-red-800' : 'text-primary hover:bg-gray-100'} py-2 px-3 rounded-md transition-colors ${getActiveClass('/admin/tournaments')}`}>Admin</Link></li>
            )}
          </ul>
        </div>
      </div>

      <div className="navbar-center hidden lg:flex">
        {/* Enlaces de navegación principal */}
        <ul className="flex space-x-4 px-2">
          <li>
            <Link 
              to="/Challenges" 
              className={`text-white hover:text-black hover:bg-white px-4 py-2 rounded-md transition-colors duration-200 ${getActiveClass('/Challenges')}`}
            >
              Challenges
            </Link>
          </li>
          <li>
            <Link 
              to="/Leaderboard" 
              className={`text-white hover:text-black hover:bg-white px-4 py-2 rounded-md transition-colors duration-200 ${getActiveClass('/Leaderboard')}`}
            >
              Leaderboard
            </Link>
          </li>
          <li>
            <Link 
              to="/Blog" 
              className={`text-white hover:text-black hover:bg-white px-4 py-2 rounded-md transition-colors duration-200 ${getActiveClass('/Blog')}`}
            >
              Blog
            </Link>
          </li>
          <li>
            <Link 
              to="/Home" 
              className={`text-white hover:text-black hover:bg-white px-4 py-2 rounded-md transition-colors duration-200 ${getActiveClass('/Home')}`}
            >
              Profile
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link 
                to="/admin/tournaments" 
                className={`text-white hover:text-black hover:bg-white px-4 py-2 rounded-md transition-colors duration-200 ${getActiveClass('/admin/tournaments')}`}
              >
                Admin
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className="navbar-end">
        {/* Toggle de tema */}
        <button
          onClick={toggleTheme}
          className="btn btn-circle btn-ghost mr-2"
          title="Toggle theme"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Avatar y desplegable de perfil */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle border-2 border-white hover:border-gray-300"
          >
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="Profile"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                />
              </div>
            </div>
          </div>
          <ul
            tabIndex={0}
            className={`menu menu-sm dropdown-content ${isDark ? 'bg-red-950 text-white' : 'bg-base-100 text-gray-800'} rounded-box z-10 mt-3 w-60 p-3 shadow-lg`}
          >
            <li className="font-medium text-base mb-1">
              <a className={`${isDark ? 'hover:bg-red-800 hover:text-white' : 'hover:bg-gray-200 hover:text-black'}`}>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </span>
              </a>
            </li>
            
            <li className="font-medium text-base">
              <a onClick={handleLogout} className="text-red-500 hover:text-white hover:bg-red-500">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;