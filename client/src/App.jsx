import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

import "./styles/App.css";
import "./styles/theme.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import ChallengeQuestion from "./pages/ChallengeQuestion";
import Leaderboard from "./pages/Leaderboard";
import Blog from "./pages/Blog";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { verifyAdminStatus } from "./utils/adminHelper";
import { AuthProvider } from './contexts/AuthContext';
import UserSettings from "./pages/UserSettings";

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { isAdmin } = await verifyAdminStatus();
        setIsAdmin(isAdmin);
      } catch (error) {
        console.error('Admin verification failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};



const App = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setAuthState({ isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        // Optimistically set as authenticated while we verify
        setAuthState({ isAuthenticated: true, isLoading: true });
        
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setAuthState({
          isAuthenticated: response.ok,
          isLoading: false
        });

        if (!response.ok) {
          localStorage.removeItem("authToken");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        setAuthState({ isAuthenticated: false, isLoading: false });
      }
    };

    verifyAuth();
  }, []);

  // Add theme transition class after initial mount
  useEffect(() => {
    document.documentElement.classList.add('theme-transition');
    return () => {
      document.documentElement.classList.remove('theme-transition');
    };
  }, []);

  const handleLogin = () => {
    setAuthState({ isAuthenticated: true, isLoading: false });
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes with Layout */}
      <Route
        element={
          <ProtectedRoute isAuthenticated={authState.isAuthenticated} isLoading={authState.isLoading}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenge-details/:id" element={<ChallengeDetails />} />
        <Route path="/challenges/:challengeId/:questionId" element={<ChallengeQuestion />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/challenges/:challengeId/:questionId" element={<ChallengeQuestion />} />
        <Route path="/user-settings" element={<UserSettings />} />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>

      {/* Redirect root to /home */}
      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default App;
