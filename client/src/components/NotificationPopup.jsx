import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationPopup = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'error', 'warning'
  confirmButtonText = 'OK',
  cancelButtonText,
  onConfirm,
  onCancel
}) => {
  // Button styles are consistent now - always primary
  const buttonStyle = "bg-primary hover:bg-primary-focus text-primary-content px-4 py-2 rounded-md transition-colors";
  const outlineButtonStyle = "bg-transparent border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded-md transition-colors";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onCancel || onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-base-100 rounded-lg shadow-lg max-w-md w-full p-6 pointer-events-auto">
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{title || 'Notification'}</h2>
              </div>
              
              {/* Message */}
              <div className="text-center mb-6">
                <p className="text-base-content">{message}</p>
              </div>
              
              {/* Buttons */}
              <div className={`flex ${cancelButtonText ? 'justify-between' : 'justify-center'} gap-4`}>
                {cancelButtonText && (
                  <button
                    onClick={onCancel || onClose}
                    className={outlineButtonStyle}
                  >
                    {cancelButtonText}
                  </button>
                )}
                <button
                  onClick={onConfirm || onClose}
                  className={buttonStyle}
                >
                  {confirmButtonText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup; 