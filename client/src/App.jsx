import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router,Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute';
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";

const App = () => {
  const [isAuthenticated, setIsAuthenticated]=useState(false);
  const location=useLocation(); //para conseguir la ruta actual
  //ahorita lo ando usando para renderizar el navbar condicionalmente

  useEffect(()=>{
    const token=localStorage.getItem("authToken");
    if(token){
      setIsAuthenticated(true);
    }

  },[]);
  
  const handleLogin=()=>{
    setIsAuthenticated(true);
  };

  
  return (
    <div>
      <Navbar/>
    <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
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
      </Routes>
  </div>
  );
};

export default App;
