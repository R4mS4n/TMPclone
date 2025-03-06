import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  //estamos consiguiendo la ruta actual para determinar que deberia mostrar la Navbar
  //estoy 99% seguro de que vamos a cambiar esto, al menos lo del display ofc
  return (
    <nav>
      <ul>
        {location.pathname === "/login" || location.pathname === "/register" ? (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/leaderboard">Leaderboard</Link></li>
            <li><Link to="/help">Help</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;

