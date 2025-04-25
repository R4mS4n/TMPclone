import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router,Routes, Route, useLocation } from 'react-router-dom';
import './styles/App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Challenges from './pages/Challenges';
import Leaderboard from './pages/Leaderboard';
import Blog from './pages/Blog';

import ProtectedRoute from './components/ProtectedRoute';
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Admin from './pages/Admin';

const App = () => {
  const [isAuthenticated, setIsAuthenticated]=useState(false);
  const location=useLocation(); //para conseguir la ruta actual
 //quite la navbar pa que no aparezca en registro ni login, la empezare a poner en cualquier otra pag
 //tmb comente el ProtectedRoute pa que lo pongas otra vez xd 
  useEffect(()=>{
    const token=localStorage.getItem("authToken");
    if(token){
      setIsAuthenticated(true);
    }

  },[]);
  
  const handleLogin=()=>{
    setIsAuthenticated(true);
  };

  //const noNavBarRoutes=['/forgot-password','/reset-password'];
  return (
    <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/home" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home />
            </ProtectedRoute>}/>
        <Route path="/challenges" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <Challenges/> 
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
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
};

export default App;


