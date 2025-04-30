import React from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSidebar = ({ isOpen, onToggle, onNavigation }) => {
  const location = useLocation();

  const handleNavLinkClick = () => {
    if (onNavigation) {
      onNavigation();
    }
  };

  return (
    <>
      <div className="fixed top-20 left-0 z-50">
        <motion.div
          animate={{ x: isOpen ? 256 : 0 }}
          initial={{ x: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <button
            onClick={onToggle}
            className="bg-primary hover:bg-primary-focus text-primary-content p-2 rounded-r-lg transition-colors"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <motion.svg
              animate={{ rotate: isOpen ? 180 : 0 }}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L8 12L15 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-16 bg-black bg-opacity-50 z-40"
              onClick={onToggle}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-base-100 z-50"
            >
              <div className="p-4 border-b border-base-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-base-content">Admin Dashboard</h2>
                </div>
              </div>

              <nav className="p-4 space-y-2">
                <NavLink
                  to="/admin/tournaments"
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content hover:bg-primary-focus'
                        : 'text-base-content/60 hover:bg-base-200'
                    }`
                  }
                  onClick={handleNavLinkClick}
                >
                  <span>Tournaments</span>
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content hover:bg-primary-focus'
                        : 'text-base-content/60 hover:bg-base-200'
                    }`
                  }
                  onClick={handleNavLinkClick}
                >
                  <span>Users</span>
                </NavLink>
                <NavLink
                  to="/admin/stats"
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content hover:bg-primary-focus'
                        : 'text-base-content/60 hover:bg-base-200'
                    }`
                  }
                  onClick={handleNavLinkClick}
                >
                  <span>User Stats</span>
                </NavLink>
                <NavLink
                  to="/admin/notifications"
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content hover:bg-primary-focus'
                        : 'text-base-content/60 hover:bg-base-200'
                    }`
                  }
                  onClick={handleNavLinkClick}
                >
                  <span>Notifications</span>
                </NavLink>
                <NavLink
                  to="/admin/settings"
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content hover:bg-primary-focus'
                        : 'text-base-content/60 hover:bg-base-200'
                    }`
                  }
                  onClick={handleNavLinkClick}
                >
                  <span>Settings</span>
                </NavLink>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar; 