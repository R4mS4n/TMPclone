import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router,Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute';

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

  const showNavBar=location.pathname === "/login"||location.pathname==="/register";
  return (
    <div>
      {showNavBar && <Navbar/>}
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
      </Routes>
  </div>
  );
}

export default App;

