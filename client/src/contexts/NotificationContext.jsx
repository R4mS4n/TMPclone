import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationPopup from '../components/NotificationPopup';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmButtonText: 'OK',
    cancelButtonText: null,
    onConfirm: null,
    onCancel: null,
  });

  const showNotification = useCallback((notificationConfig) => {
    setNotification({
      ...notification,
      isOpen: true,
      ...notificationConfig,
    });
  }, [notification]);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Helper methods for common notification types
  const notify = useCallback((message, title = 'Notification') => {
    showNotification({ message, title, type: 'info' });
  }, [showNotification]);

  const notifySuccess = useCallback((message, title = 'Success') => {
    showNotification({ message, title, type: 'success' });
  }, [showNotification]);

  const notifyError = useCallback((message, title = 'Error') => {
    showNotification({ message, title, type: 'error' });
  }, [showNotification]);

  const notifyWarning = useCallback((message, title = 'Warning') => {
    showNotification({ message, title, type: 'warning' });
  }, [showNotification]);

  const confirm = useCallback((message, onConfirm, onCancel, options = {}) => {
    showNotification({
      message,
      title: options.title || 'Confirm',
      type: options.type || 'warning',
      confirmButtonText: options.confirmButtonText || 'OK',
      cancelButtonText: options.cancelButtonText || 'Cancel',
      onConfirm: () => {
        if (onConfirm) onConfirm();
        hideNotification();
      },
      onCancel: () => {
        if (onCancel) onCancel();
        hideNotification();
      },
    });
  }, [showNotification, hideNotification]);

  const handleConfirm = () => {
    if (notification.onConfirm) {
      notification.onConfirm();
    }
    hideNotification();
  };

  const handleCancel = () => {
    if (notification.onCancel) {
      notification.onCancel();
    }
    hideNotification();
  };

  return (
    <NotificationContext.Provider
      value={{
        notification,
        showNotification,
        hideNotification,
        notify,
        notifySuccess,
        notifyError,
        notifyWarning,
        confirm,
      }}
    >
      {children}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmButtonText={notification.confirmButtonText}
        cancelButtonText={notification.cancelButtonText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </NotificationContext.Provider>
  );
}; 