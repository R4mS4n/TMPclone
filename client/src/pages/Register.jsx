import { useState } from "react";
import fondo from "../cimages/Bg-geometry.jpg";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    mail: "",
    password: "",
  });
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        alert("Registration successful!");
        window.location.href = "/login";
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("error registering user: ", error);
      alert("Error registering user");
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
          Sign Up
        </h2>

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

          <div>
            <label className="label">
              <span className={`label-text ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
                Password
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className={`input input-bordered w-full ${theme === 'TMPdark' ? 'bg-base-200' : 'bg-white text-black'}`}
                onChange={handleChange}
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

          <button 
            type="submit" 
            className={`btn w-full ${theme === 'TMPdark' ? 'btn-primary' : 'bg-black text-white hover:bg-neutral'}`}
          >
            Register
          </button>
        </form>

        <p className={`text-center text-sm ${theme === 'TMPdark' ? 'text-base-content' : 'text-white'}`}>
          Already have an account?{" "}
          <a 
            href="/login" 
            className={`font-medium ${theme === 'TMPdark' 
              ? 'text-primary hover:underline' 
              : 'text-black hover:underline'}`}
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
