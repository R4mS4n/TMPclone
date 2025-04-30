import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import "./styles/App.css";
import "./styles/theme.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import Leaderboard from "./pages/Leaderboard";
import Blog from "./pages/Blog";
import Admin from "./pages/Admin";
import ChallengeQuestion from "./pages/ChallengeQuestion.jsx";
import ForgotPassword from "./pages/ForgotPassword"; // use this if it's your custom version
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Challenges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenge-details/:id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ChallengeDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blog"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Blog />
          </ProtectedRoute>
        }
      />
    <Route path="/challenges/:challengeId/:questionId" element={<ChallengeQuestion />} />

    </Routes>
  );
};

export default App;
