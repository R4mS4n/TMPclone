import React, {useState, useEffect} from "react";
import { Link, useLocation } from "react-router-dom";
import {verifyAdminStatus} from "../utils/adminHelper";

const Navbar = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Define routes dynamically
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
    <nav>
      <ul>
        {linksToDisplay.map((route) => (
          <li key={route.path}>
            <Link to={route.path}>{route.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;

