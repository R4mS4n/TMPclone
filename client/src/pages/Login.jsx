import { useState } from "react";
import { useNavigate } from "react-router-dom";
import fondo from "../cimages/TechM.jpg";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ mail: email, password: password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        onLogin();
        navigate("/home");
      } else {
        setError(data.message || "Invalid Credentials");
      }
    } catch (err) {
      setError(`Network Error. Try again later. Details: ${err.message}`);
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

      <div className="relative z-10 w-full flex justify-end items-center">
        <div 
          className={`w-full sm:w-[90%] md:w-[70%] lg:w-[40%] h-full min-h-screen
          shadow-lg px-8 py-12 space-y-6 flex flex-col justify-center rounded-l-lg
          ${theme === 'TMPdark' 
            ? 'bg-base-100 text-base-content' 
            : 'bg-red-600 text-white'}`}
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
                name="mail"
                placeholder="Input your e-mail address"
                className={`input input-bordered w-full ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white text-black'}`}
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
                  className={`input input-bordered w-full ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white text-black'}`}
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className={`checkbox appearance-none h-5 w-5 border rounded ${theme === 'TMPdark' 
                    ? 'border-red-600 bg-transparent checked:bg-red-600' 
                    : 'border-2 border-black bg-transparent checked:bg-black checked:text-white'}`} 
                />
                <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-white font-medium'}`}>
                  Remember me
                </span>
              </label>
              <a href="/forgot-password" className={`font-medium ${theme === 'TMPdark' ? 'link link-error' : 'text-black hover:underline'}`}>
                Have you forgotten your password?
              </a>
            </div>

            <button
              type="submit"
              className={`btn w-full ${theme === 'TMPdark' ? 'btn-primary' : 'bg-black text-white hover:bg-neutral'} ${loading ? "loading" : ""}`}
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
