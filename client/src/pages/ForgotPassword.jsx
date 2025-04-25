import { useState } from "react";
import fondo from "../cimages/Bg-geometry.jpg";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    username: "",
    mail: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { theme } = useTheme();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    try {
      // Aquí iría la llamada a la API para recuperar la contraseña
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Password reset instructions sent to your email!");
      } else {
        setMessage(data.message || "Error sending password reset instructions");
      }
    } catch (error) {
      console.error("Error requesting password reset: ", error);
      setMessage("Error connecting to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center transition-colors duration-300"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <ThemeToggle />

      <div className={`w-full max-w-md p-8 space-y-4 shadow-lg rounded-2xl backdrop-blur-sm 
        ${theme === 'TMPdark' 
          ? 'bg-base-100 text-base-content' 
          : 'bg-red-600 text-white'}`}>
        
        <h2 className={`text-2xl font-bold text-center ${theme === 'TMPdark' ? 'text-primary' : 'text-white'}`}>
          Forgot Password
        </h2>

        <p className={`text-center ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
          Enter your username and email to receive password reset instructions
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
                Username
              </span>
            </label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              className={`input input-bordered w-full ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white text-black'}`}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">
              <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
                Email
              </span>
            </label>
            <input
              type="email"
              name="mail"
              placeholder="Email"
              className={`input input-bordered w-full ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white text-black'}`}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`btn w-full ${theme === 'TMPdark' ? 'btn-primary' : 'bg-black text-white hover:bg-neutral'} ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Sending..." : "Reset Password"}
          </button>

          {message && (
            <div className={`text-sm text-center mt-2 ${message.includes("Error") ? "text-error" : "text-success"}`}>
              {message}
            </div>
          )}
        </form>

        <p className={`text-center text-sm ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
          Mistaken?{" "}
          <a 
            href="/login" 
            className={`font-medium ${theme === 'TMPdark' 
              ? 'text-primary hover:underline' 
              : 'text-black hover:underline'}`}
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword; 