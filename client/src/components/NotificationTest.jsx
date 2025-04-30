import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationTest = () => {
  const { 
    notify, 
    notifySuccess, 
    notifyError, 
    notifyWarning, 
    confirm 
  } = useNotification();

  // Common button styles with consistent shape
  const baseButtonStyle = "px-4 py-2 rounded-md transition-colors w-full";
  const primaryButtonStyle = `${baseButtonStyle} bg-primary hover:bg-primary-focus text-primary-content`;
  const successButtonStyle = `${baseButtonStyle} bg-success hover:bg-success/90 text-success-content`;
  const errorButtonStyle = `${baseButtonStyle} bg-error hover:bg-error/90 text-error-content`;
  const warningButtonStyle = `${baseButtonStyle} bg-warning hover:bg-warning/90 text-warning-content`;
  const neutralButtonStyle = `${baseButtonStyle} bg-neutral hover:bg-neutral/90 text-neutral-content`;

  return (
    <div className="p-6 bg-base-200 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Notification Test</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => notify('This is an information message')}
          className={primaryButtonStyle}
        >
          Show Info
        </button>
        
        <button 
          onClick={() => notifySuccess('Your action was successful!')}
          className={successButtonStyle}
        >
          Show Success
        </button>
        
        <button 
          onClick={() => notifyError('An error occurred')}
          className={errorButtonStyle}
        >
          Show Error
        </button>
        
        <button 
          onClick={() => notifyWarning('This is a warning message')}
          className={warningButtonStyle}
        >
          Show Warning
        </button>
        
        <button 
          onClick={() => confirm(
            'Are you sure you want to proceed?',
            () => notifySuccess('You confirmed the action!'),
            () => notifyWarning('Action canceled')
          )}
          className={neutralButtonStyle + " col-span-2"}
        >
          Show Confirmation
        </button>
      </div>
    </div>
  );
};

export default NotificationTest; 