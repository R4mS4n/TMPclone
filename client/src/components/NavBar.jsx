import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  // Define routes dynamically
  const routes = {
    auth: [
      { path: "/login", label: "Login" },
      { path: "/register", label: "Register" },
    ],
    main: [
      { path: "/home", label: "Home" },
      { path: "/leaderboard", label: "Leaderboard" },
      { path: "/help", label: "Help" },
      { path: "/challenges", label: "Challenges"}
    ],
  };

  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const linksToDisplay = isAuthPage ? routes.auth : routes.main;

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

