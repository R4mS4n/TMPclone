import React, {useState, useEffect} from "react";
import { Link, useLocation } from "react-router-dom";
import {verifyAdminStatus} from "../utils/adminHelper";

const Navbar = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const routes = {
    auth: [
      { path: "/login", label: "Login" },
      { path: "/register", label: "Register" },
    ],
    main: [
      { path: "/home", label: "Home" },
      { path: "/leaderboard", label: "Leaderboard" },
      { path: "/help", label: "Help" },
      { path: "/challenges", label: "Challenges"},
      ...(isAdmin ? [{path: "/admin", label: "Admin"}] : [])
    ]
  };

  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const linksToDisplay = isAuthPage ? routes.auth : routes.main;

  if (isLoading) {
    return (
      <nav className="navbar">
        <div className="navbar-loading">Loading navigation...</div>
      </nav>
    );
  }

  return (
    <nav className="flex justify-center p-4 bg-gray-100 shadow-sm">
      <div className="flex space-x-2">
        {linksToDisplay.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className={`
              px-4 py-2 rounded-md transition-all
              ${
                location.pathname === route.path
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-800 hover:bg-blue-100 border border-gray-200"
              }
              font-medium text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
          >
            {route.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;

