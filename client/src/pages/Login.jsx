import { useState } from "react";
import {useNavigate} from "react-router-dom"

export default function Login({onLogin}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false);
  const navigate=useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({mail: email, password: password,}),
      headers: { "Content-Type": "application/json" },
    });
    
    const data = await response.json();

    if (response.ok) {
      const data=await response.json();
      localStorage.setItem("authToken",data.token);
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
    <div className="login-container">
      <div className="login-form">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Conditionally render the error message */}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

