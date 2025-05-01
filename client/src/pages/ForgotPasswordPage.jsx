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
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="w-full max-w-md p-8 space-y-4 shadow-lg bg-base-100 rounded-md">
        <h2 className="text-2xl font-bold text-center text-primary">Reset Password</h2>
        <p className="text-center text-base-content">Enter your email to receive a reset link</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input w-full rounded-md"
              required
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-2.5 rounded-md transition-colors duration-200 bg-primary text-white hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span> 
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {message.text && (
          <p className={`text-sm text-center ${message.isError ? 'text-error' : 'text-success'}`}>
            {message.text}
          </p>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="text-primary hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
