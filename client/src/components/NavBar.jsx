import React, { useState, useEffect } from "react";

import { Link, useLocation } from "react-router-dom";
import { verifyAdminStatus } from "../utils/adminHelper";
import fondo from "../cimages/TMw-logo.png"; // Logo

const Navbar = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const adminStatus = await verifyAdminStatus();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [location.pathname]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const isDark = savedDarkMode === "true";
    setDarkMode(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "TMPdark" : "TMPlight");
  }, []);

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    localStorage.setItem("darkMode", newDark ? "true" : "false");
    document.documentElement.setAttribute("data-theme", newDark ? "TMPdark" : "TMPlight");
  };

  const routes = {
    auth: [
      { path: "/login", label: "Login" },
      { path: "/register", label: "Register" },
    ],
    main: [
      { path: "/home", label: "Home" },
      { path: "/leaderboard", label: "Leaderboard" },
      { path: "/blog", label: "Blog" },
      { path: "/challenges", label: "Challenges" },
      ...(isAdmin ? [{ path: "/admin", label: "Admin" }] : []),
    ],
  };

  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const linksToDisplay = isAuthPage ? routes.auth : routes.main;

  if (isLoading) {
    return (
      <nav className="navbar bg-base-100 p-4 shadow">
        <span className="text-sm">Loading navigation...</span>
      </nav>
    );
  }

  return (
    <div className="navbar bg-primary text-white shadow-md">
      {/* Logo y menú */}
      <div className="navbar-start">
        <img src={fondo} alt="Logo" className="w-36 h-auto mr-4" />
  
        {/* Dropdown */}
        {!isAuthPage && (
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-10 p-2 shadow bg-base-100 rounded-box w-52 text-black">
              {routes.main.map(route => (
                <li key={route.path}>
                  <Link to={route.path}>{route.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
  
      {/* Main nav for desktop */}
      {!isAuthPage && (
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {routes.main.map(route => (
              <li key={route.path}>
                <Link
                  to={route.path}
                  className={`${
                    location.pathname === route.path ? "bg-white text-primary font-semibold" : "hover:text-red-400"
                  }`}
                >
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
  
      {/* Avatar y settings */}
      <div className="navbar-end space-x-4">
        {!isAuthPage && (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="Profile"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-10 p-2 shadow bg-base-100 rounded-box w-52">
              <li onClick={() => setSettingsOpen(!settingsOpen)}>
                <a>Settings</a>
              </li>
              {settingsOpen && (
                <div className="px-2 py-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Dark Mode</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={darkMode}
                      onChange={toggleDarkMode}
                    />
                  </div>
                </div>
              )}
              <li className="text-red-500 hover:text-red-700">
                <a>Log out</a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
export default Navbar;