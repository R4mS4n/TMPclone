import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import fondo from "../cimages/TMw-logo.png"; // Asegúrate de que la ruta de la imagen esté bien

const Navbar = () => {
  const location = useLocation();

  // State para manejar la expansión de la sección "Settings"
  const [settingsOpen, setSettingsOpen] = useState(false);

  // State para el tamaño de la letra
  const [fontSize, setFontSize] = useState("text-base"); // Default text size

  // State para el modo de color (light/dark)
  const [darkMode, setDarkMode] = useState(false);

  // Al cargar el componente, leemos el estado de 'darkMode' desde localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "true") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "TMPdark");
    } else {
      setDarkMode(false);
      document.documentElement.setAttribute("data-theme", "TMPlight");
    }
  }, []);

  // Función para cambiar el tamaño de la letra
  const handleFontSizeChange = (e) => {
    setFontSize(e.target.value);
  };

  // Función para cambiar el modo de color (light/dark)
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    // Guardar el estado del toggle en localStorage
    localStorage.setItem("darkMode", newDarkMode ? "true" : "false");

    // Cambiar el tema en el HTML
    if (newDarkMode) {
      document.documentElement.setAttribute("data-theme", "TMPdark");
    } else {
      document.documentElement.setAttribute("data-theme", "TMPlight");
    }
  };

  return (
    <div className="navbar bg-primary shadow-sm">
      <div className="navbar-start">
        {/* Image on the left */}
        <div className="flex items-center">
          <img
            src={fondo} // Usa la imagen importada como fuente
            alt="Logo"
            className="w-35 h-10 mr-2" // Ajusta el tamaño de la imagen
          />
        </div>

        {/* Menu Button for Mobile */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li><Link to="/login" className="text-white hover:text-red-400">Login</Link></li>
            <li><Link to="/register" className="text-white hover:text-red-400">Register</Link></li>
            <li><Link to="/home" className="text-white hover:text-red-400">Home</Link></li>
            <li><Link to="/leaderboard" className="text-white hover:text-red-400">Leaderboard</Link></li>
            <li><Link to="/help" className="text-white hover:text-red-400">Help</Link></li>
          </ul>
        </div>
      </div>

      <div className="navbar-center hidden lg:flex">
        {/* Main Navigation Links */}
        <ul className="menu menu-horizontal p-0">
          <li><Link to="/Challenges" className="text-white hover:text-red-400">Desafíos</Link></li>
          <li><Link to="/Leaderboard" className="text-white hover:text-red-400">Leaderboard</Link></li>
          <li><Link to="/Blog" className="text-white hover:text-red-400">Blog</Link></li>
          <li><Link to="/Home" className="text-white hover:text-red-400">Perfil</Link></li>
        </ul>
      </div>

      <div className="navbar-end">
        {/* Avatar Profile Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              <img
                alt="Profile"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li
              onClick={() => setSettingsOpen(!settingsOpen)} // Toggle Settings
            >
              <a>Configuración</a>
            </li>
            {settingsOpen && (
              <div className="p-1 space-y-4">
                {/* Font Size Control */}
                <div>
                  <label className="label p-2">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={handleFontSizeChange}
                    className="select select-bordered w-full"
                  >
                    <option value="text-sm">Small</option>
                    <option value="text-base">Normal</option>
                    <option value="text-lg">Large</option>
                    <option value="text-xl">Extra Large</option>
                  </select>
                </div>

                {/* Dark Mode Toggle */}
                <div className="flex items-center">
                  <label className="label">
                    <span className="label-text p-2">Dark Mode  </span>
                  </label>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary ml-1"
                    checked={darkMode} // Aquí sincronizas el estado con el toggle
                    onChange={toggleDarkMode} // Cambia el tema al hacer clic
                  />
                </div>
              </div>
            )}
            <li><a>Cerrar Sesión</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
