// src/pages/Login.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import fondo from "../cimages/TechM.jpg";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";
import apiClient from "../utils/api";

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  useEffect(() => {
    localStorage.removeItem("authToken");
  }, []);

  const { setCurrentUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/login", { email, password });
      
      localStorage.setItem("authToken", response.data.token);
      
      const meRes = await apiClient.get("/auth/me");
      
      setCurrentUser(meRes.data);
      onLogin?.();
      navigate("/home");
      console.log("Login successful:", meRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full transition-colors duration-300 bg-cover bg-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <ThemeToggle />

      <div className="absolute inset-0 bg-black opacity-35"></div>

      <div className="relative z-10 w-full flex justify-end items-center">
        <div 
          className={`w-full sm:w-[90%] md:w-[70%] lg:w-[40%] h-full min-h-screen
          shadow-lg px-8 py-12 space-y-6 flex flex-col justify-center 
          ${theme === 'TMPdark' 
            ? 'bg-base-100 text-base-content' 
            : 'bg-[#E31321] text-white'}`}
        >
          <h2 className={`text-3xl font-bold text-center ${theme === 'TMPdark' ? 'text-primary' : 'text-white'}`}>
            Sign in
          </h2>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="form-control">
              <label className="label">
                <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
                  E-mail address
                </span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Input your e-mail address"
                className={`input w-full h-12 rounded-md ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white text-black'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Input your password"
                  className={`input w-full h-12 rounded-md ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white text-black'}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    theme === 'TMPdark'
                      ? 'text-gray-400 hover:text-gray-200' // Icon color for dark theme
                      : 'text-gray-600 hover:text-black'   // Icon color for light theme
                  }`}
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L6.228 6.228" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className={`checkbox appearance-none h-5 w-5 rounded-sm ${theme === 'TMPdark' 
                    ? 'border-red-600 bg-transparent checked:bg-red-600' 
                    : 'border-2 border-white bg-transparent checked:bg-white checked:text-[#E31321]'}`} 
                />
                <span className={`label-text font-medium ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
                  Remember me
                </span>
              </label>
              <a href="/forgot-password" className={`font-medium underline ${theme === 'TMPdark' ? 'link link-error' : 'text-white hover:text-white'}`}>
                Have you forgotten your password?
              </a>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-md transition-colors duration-200 ${theme === 'TMPdark' 
                ? 'bg-primary text-white hover:bg-primary/90' 
                : 'bg-black text-white hover:bg-neutral'} ${loading ? "opacity-75" : ""}`}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {error && (
              <div className="text-error text-sm text-center mt-2">
                {error}
              </div>
            )}
          </form>

          <p className={`text-sm text-center ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
            Don't have an account yet?{" "}
            <a 
              href="/register" 
              className={`font-medium ${theme === 'TMPdark' 
                ? 'text-primary hover:underline' 
                : 'text-black hover:underline'}`}
            >
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
