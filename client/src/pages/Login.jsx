import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import fondo from "../cimages/TechM.jpg";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("authToken");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
        console.log("Login successful:", data);
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(`Network error. Please try again. Details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-end min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="flex flex-col justify-center items-center w-full lg:w-1/3 p-8 space-y-6 bg-red-600 text-white shadow-lg min-h-screen backdrop-blur-md">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white">Email</span>
            </label>
            <input
              type="email"
              name="mail"
              placeholder="Enter your email"
              className="input input-bordered w-full text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-white">Password</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="input input-bordered w-full text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-md border-white checked:border-white checked:bg-white"
              />
              <span className="text-white">Remember me</span>
            </label>
            <a href="/forgot-password" className="text-white hover:underline">
              Forgot your password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-neutral w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error && (
            <div className="text-center text-error text-sm mt-2">{error}</div>
          )}
        </form>

        <p className="text-center text-sm">
          Don’t have an account?{" "}
          <a href="/register" className="text-white hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
