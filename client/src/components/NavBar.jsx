// src/components/NavBar.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import fondo from "../cimages/TMw-logo.png";
import { useTheme } from "../contexts/ThemeContext";
import { verifyAdminStatus } from "../utils/adminHelper";
import { AuthContext } from "../contexts/AuthContext";

const NavBar = () => {
  // Si AuthContext es undefined, le asignamos un objeto vacío para no romper el destructuring
  const authContext = useContext(AuthContext) || {};
  const { currentUser } = authContext;

  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "TMPdark";

  const [isAdmin, setIsAdmin] = useState(false);

  // Consulta API para ver si el usuario es admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { isAdmin } = await verifyAdminStatus();
        setIsAdmin(isAdmin);
      } catch (err) {
        console.error("Error checking admin status:", err);
      }
    };
    checkAdmin();
  }, []);

  // Devuelve la clase para indicar el link activo
  const getActiveClass = (path) =>
    location.pathname === path ? "font-bold border-b-2 border-white" : "";

  // Logout: borramos el token y redirigimos a /login
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // URL del avatar (puedes reemplazar por currentUser.profile_pic si lo guardas)
  const avatarUrl =
    currentUser?.profile_pic ||
    "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";

  return (
    <div
      className={`navbar ${isDark ? "bg-red-900" : "bg-primary"} shadow-lg transition-colors duration-300`}
    >
      {/* --- Mobile & Logo --- */}
      <div className="navbar-start">
        <div className="flex items-center ml-2">
          <img src={fondo} alt="Logo" className="w-35 h-10 mr-2" />
        </div>
        <div className="dropdown">
          <div tabIndex={0} className="btn btn-ghost lg:hidden">
            {/* Ícono hamburguesa */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className={`menu menu-sm dropdown-content ${
              isDark ? "bg-red-950 text-white" : "bg-base-100 text-gray-800"
            } rounded-box z-10 mt-3 w-52 p-2 shadow`}
          >
            <li>
              <Link to="/Challenges" className={getActiveClass("/Challenges")}>
                Challenges
              </Link>
            </li>
            <li>
              <Link to="/Leaderboard" className={getActiveClass("/Leaderboard")}>
                Leaderboard
              </Link>
            </li>
            <li>
              <Link to="/Blog" className={getActiveClass("/Blog")}>
                Blog
              </Link>
            </li>
            <li>
              <Link to="/Home" className={getActiveClass("/Home")}>
                Profile
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link to="/admin/tournaments" className={getActiveClass("/admin/tournaments")}>
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* --- Desktop Links --- */}
      <div className="navbar-center hidden lg:flex">
        <ul className="flex space-x-4 px-2">
          <li>
            <Link to="/Challenges" className={`text-white hover:text-black px-4 py-2 rounded-md transition-colors ${getActiveClass("/Challenges")}`}>
              Challenges
            </Link>
          </li>
          <li>
            <Link to="/Leaderboard" className={`text-white hover:text-black px-4 py-2 rounded-md transition-colors ${getActiveClass("/Leaderboard")}`}>
              Leaderboard
            </Link>
          </li>
          <li>
            <Link to="/Blog" className={`text-white hover:text-black px-4 py-2 rounded-md transition-colors ${getActiveClass("/Blog")}`}>
              Blog
            </Link>
          </li>
          <li>
            <Link to="/Home" className={`text-white hover:text-black px-4 py-2 rounded-md transition-colors ${getActiveClass("/Home")}`}>
              Profile
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link to="/admin/tournaments" className={`text-white hover:text-black px-4 py-2 rounded-md transition-colors ${getActiveClass("/admin/tournaments")}`}>
                Admin
              </Link>
            </li>
          )}
        </ul>
      </div>

      {/* --- Theme Toggle & Profile Dropdown --- */}
      <div className="navbar-end">
        <button onClick={toggleTheme} className="btn btn-circle btn-ghost mr-2" title="Toggle theme">
          {isDark ? (
            // Sol
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m8-8h1M3 12H2m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
          ) : (
            // Luna
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} className="flex items-center space-x-2 btn btn-ghost">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img alt="Profile" src={avatarUrl} />
              </div>
            </div>
            <span className="hidden lg:inline text-white">
              {currentUser?.username || "Guest"}
            </span>
          </div>
          <ul
            tabIndex={0}
            className={`menu menu-sm dropdown-content ${
              isDark ? "bg-red-950 text-white" : "bg-base-100 text-gray-800"
            } rounded-box z-10 mt-3 w-60 p-3 shadow-lg`}
          >
            <li className="font-medium text-base mb-1">
              {currentUser?.username || "Guest"}
            </li>
            <li className="font-medium text-base">
              <button
                onClick={handleLogout}
                className="w-full text-left text-red-500 hover:text-white hover:bg-red-500 p-2 rounded"
              >
                Log out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
