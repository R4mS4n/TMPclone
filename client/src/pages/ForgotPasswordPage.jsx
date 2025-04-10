import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ 
          text: 'If this email exists in our system, you will receive a password reset link shortly.',
          isError: false 
        });
      } else {
        setMessage({ 
          text: data.message || 'Unable to process your request', 
          isError: true 
        });
      }
    } catch (error) {
      console.log(error);
      setMessage({ 
        text: 'Network error. Please check your connection and try again.', 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p>Enter your email to receive a reset link</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {message.text && (
          <p className={`auth-message ${message.isError ? 'error' : 'success'}`}>
            {message.text}
          </p>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
