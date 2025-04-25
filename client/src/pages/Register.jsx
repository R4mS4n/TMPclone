import { useState } from "react";
import { useNavigate } from "react-router-dom";
import fondo from "../cimages/Bg-geometry.jpg";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    mail: "",
    password: "",
  });

  const [message, setMessage] = useState({ text: "", isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
      className="flex items-center justify-center min-h-screen bg-base-200 bg-cover bg-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="w-full max-w-md p-8 space-y-4 shadow-lg bg-base-100 bg-opacity-90 rounded-2xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-center text-primary">Sign Up</h2>

        {message.text && (
          <div className={`text-sm text-center ${message.isError ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="input input-bordered w-full"
              onChange={handleChange}
              value={formData.username}
              required
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              name="mail"
              placeholder="Email (must end with @techmahindra.com)"
              className="input input-bordered w-full"
              onChange={handleChange}
              value={formData.mail}
              required
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              className="input input-bordered w-full"
              onChange={handleChange}
              value={formData.password}
              required
              minLength="8"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-base-content">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
