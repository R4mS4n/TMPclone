import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/NavBar.jsx";
import {verifyAdminStatus} from '../utils/adminHelper.js';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setIsLoading(true);
        const isUserAdmin = await verifyAdminStatus();
        
        if (isUserAdmin) {
          setIsAdmin(true);
        } else {
          navigate('/login', { replace: true }); // Redirect non-admins to home
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading admin privileges...</div>;
  }

  if (!isAdmin) {
    return null; // Brief fallback before redirect
  }

  return (
    <div className="p-8">
    <Navbar/>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-4 text-green-600">
        You're seeing this because you have admin privileges.
      </p>
    </div>
  );
}
