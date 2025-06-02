// src/pages/Login.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import fondo from "../cimages/TechM.jpg";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🔑 Aquí enviamos `{ email, password }`
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // guardamos el token y notificamos al padre
        localStorage.setItem("authToken", data.token);
        const meRes = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const userData = await meRes.json();
        setCurrentUser(userData);
        onLogin?.();
        navigate("/home");
        console.log("Login successful:", userData);
      } else {
        // leemos data.error (según tu backend) o data.message
        setError(data.error || data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(`Network error. Please try again. Details: ${err.message}`);
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    /* ojo: tus SVGs aquí (omitidos por brevedad) */
                    <svg /* icono 'eye-off' */>…</svg>
                  ) : (
                    <svg /* icono 'eye' */>…</svg>
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
