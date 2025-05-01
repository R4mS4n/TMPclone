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
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="w-full max-w-md p-8 space-y-4 shadow-lg bg-base-100 rounded-md">
        <h2 className="text-2xl font-bold text-center text-primary">Set New Password</h2>
        
        {!token ? (
          <>
            <p className="text-sm text-center text-error">Invalid reset link</p>
            <div className="text-center mt-4">
              <a href="/forgot-password" className="text-primary hover:underline">
                Request new reset link
              </a>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input w-full rounded-md"
                  required
                  minLength="8"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Confirm Password</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input w-full rounded-md"
                  required
                  minLength="8"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 rounded-md transition-colors duration-200 bg-primary text-white hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            {message.text && (
              <p className={`text-sm text-center ${message.isError ? 'text-error' : 'text-success'}`}>
                {message.text}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

