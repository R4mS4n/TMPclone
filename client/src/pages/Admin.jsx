import React, { useEffect, useState } from 'react';
import {
  useNavigate,
  Routes,
  Route,
  useLocation,
  Navigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import AdminSidebar             from '../components/AdminSidebar';
import TournamentManagement     from '../components/TournamentManagement';
import UserManagement           from '../components/UserManagement';     
import { verifyAdminStatus }    from '../utils/adminHelper';

const Admin = () => {
  const [isAdmin, setIsAdmin]       = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate    = useNavigate();
  const location    = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      setIsLoading(true);
      try {
        const { isAdmin } = await verifyAdminStatus();
        if (isAdmin) {
          setIsAdmin(true);
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Admin verification failed:', err);
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-100 flex">
      <AdminSidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigation={() => setIsSidebarOpen(false)}
      />
      <motion.main className="flex-1 min-h-[calc(100vh-4rem)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6 text-base-content"
          >
            <Routes>
              <Route path="/" element={<Navigate to="/admin/tournaments" replace />} />
              <Route path="/tournaments" element={<TournamentManagement />} />
              <Route path="/users"       element={<UserManagement />} />           {/* Aquí va el componente */}
              <Route path="/stats"       element={<div className="text-base-content/60">User stats coming soon...</div>} />
              <Route path="/notifications" element={<div className="text-base-content/60">Notifications coming soon...</div>} />
              <Route path="/settings"    element={<div className="text-base-content/60">Settings coming soon...</div>} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </div>
  );
};

export default Admin;
