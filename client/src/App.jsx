import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router,Routes, Route, useLocation } from 'react-router-dom';
import './styles/App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Challenges from './pages/Challenges';

import ProtectedRoute from './components/ProtectedRoute';

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

  
  return (
    <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/home" element={<Home/>}
          /* element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home />
            </ProtectedRoute>
          } */
        />
        <Route path="/challenges" element={<Challenges/>}/>
      </Routes>
  );
}

export default App;

