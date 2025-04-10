import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!token) {
      setMessage({ text: 'Missing reset token', isError: true });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', isError: true });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ 
          text: 'Password updated successfully! Redirecting to login...', 
          isError: false 
        });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ 
          text: data.message || 'Password reset failed. The link may have expired.', 
          isError: true 
        });
      }
    } catch (error) {
      console.log(error);
      setMessage({ 
        text: 'Network error. Please try again.', 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Set New Password</h2>
        
        {!token ? (
          <>
            <p className="auth-message error">Invalid reset link</p>
            <a href="/forgot-password" className="auth-link">
              Request new reset link
            </a>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="8"
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="8"
                />
              </div>

              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            {message.text && (
              <p className={`auth-message ${message.isError ? 'error' : 'success'}`}>
                {message.text}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

