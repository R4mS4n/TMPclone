import { useState } from "react";
import { useNavigate } from "react-router-dom";
import fondo from "../cimages/Bg-geometry.jpg";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    mail: "",
    password: "",
  });

  const [message, setMessage] = useState({ text: "", isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", isError: false });

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setMessage({
          text: "Registration successful! Redirecting...",
          isError: false,
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage({
          text: data.message || "Registration failed",
          isError: true,
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage({
        text: "Network error. Please try again.",
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
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
          Sign Up
        </h2>

        {message.text && (
          <div className={`text-sm text-center ${message.isError ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-gray-700'}`}>
                Username
              </span>
            </label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              className={`input w-full h-12 rounded-md ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white border border-gray-300'}`}
              onChange={handleChange}
              value={formData.username}
              required
            />
          </div>
          <div>
            <label className="label">
              <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-gray-700'}`}>
                Email
              </span>
            </label>
            <input
              type="email"
              name="mail"
              placeholder="Email (must end with @techmahindra.com)"
              className={`input w-full h-12 rounded-md ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white border border-gray-300'}`}
              onChange={handleChange}
              value={formData.mail}
              required
            />
          </div>
          <div>
            <label className="label">
              <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-gray-700'}`}>
                Password
              </span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              className={`input w-full h-12 rounded-md ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white border border-gray-300'}`}
              onChange={handleChange}
              value={formData.password}
              required
              minLength="8"
            />
          </div>
          <button
            type="submit"
            className={`w-full h-12 rounded-md transition-colors duration-200 ${theme === 'TMPdark' 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : 'bg-[#E31321] text-white hover:bg-[#E31321]/90'} ${isSubmitting ? "opacity-75" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        <p className={`text-center text-sm ${theme === 'TMPdark' ? 'text-base-content' : 'text-gray-600'}`}>
          Already have an account?{" "}
          <a href="/login" className={`font-medium ${theme === 'TMPdark' ? 'text-primary hover:underline' : 'text-[#E31321] hover:underline'}`}>
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
