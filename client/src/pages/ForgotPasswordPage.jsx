import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../utils/api';
import fondo from "../cimages/Bg-geometry.jpg";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      await apiClient.post('/auth/forgot-password', { email });

      setMessage({ 
        text: 'If this email exists in our system, you will receive a password reset link shortly.',
        isError: false 
      });
    } catch (error) {
      console.log(error);
      setMessage({ 
        text: error.response?.data?.message || 'Unable to process your request',
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-base-200 bg-cover bg-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <ThemeToggle />
      <div className={`w-full max-w-md p-8 space-y-6 shadow-lg rounded-lg ${
        theme === 'TMPdark' 
          ? 'bg-base-100' 
          : 'bg-white'
      }`}>
        <h2 className={`text-2xl font-bold text-center ${theme === 'TMPdark' ? 'text-primary' : 'text-[#E31321]'}`}>
          Forgot Your Password?
        </h2>
        <p className={`text-center ${theme === 'TMPdark' ? 'text-base-content' : 'text-gray-600'}`}>
          Enter your email to receive a reset link
        </p>
        
        {message.text && (
          <div className={`text-sm text-center ${message.isError ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-gray-700'}`}>Email</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={`input w-full h-12 rounded-md ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white border border-gray-300'}`}
              required
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className={`w-full h-12 rounded-md transition-colors duration-200 ${theme === 'TMPdark' 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : 'bg-[#E31321] text-white hover:bg-[#E31321]/90'} ${loading ? "opacity-75" : ""}`}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className={`text-center text-sm ${theme === 'TMPdark' ? 'text-base-content' : 'text-gray-600'}`}>
          Remembered your password?{" "}
          <Link to="/login" className={`font-medium ${theme === 'TMPdark' ? 'text-primary hover:underline' : 'text-[#E31321] hover:underline'}`}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
