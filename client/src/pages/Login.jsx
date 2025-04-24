import { useState } from "react";
import {useNavigate} from "react-router-dom"
import fondo from "../cimages/TechM.jpg"; 

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        setError(data.message);
      }
    } catch (err) {
      console.error("Error during request: ", err);
      setError(`Network error. Please try again later. Details: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-end min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="flex flex-col justify-center items-center w-full lg:w-1/3 p-8 space-y-4 shadow-lg bg-red-600 text-white backdrop-blur-sm h-full min-h-screen">
        <h2 className="text-3xl font-bold text-center mb-4">Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="mail"
              placeholder="Introduce tu correo"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Actualiza el correo
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Introduce tu contraseña"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Actualiza la contraseña
              required
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <input type="checkbox" id="rememberMe" className="checkbox checkbox-md border-white checked:border-white checked:bg-white" />
              <label htmlFor="rememberMe" className="ml-2">Remember me</label>
            </div>
            <a href="/forgot-password" className="text-white hover:underline">Forgot your password?</a>
          </div>
          <button type="submit" className="btn btn-neutral w-full" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        {error && <p className="text-red-500 text-center">{error}</p>} {/* Muestra el error si hay */}
        <p className="text-center text-sm">
          Don't Have an Account Yet?{" "}
          <a href="/register" className="text-white hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
}