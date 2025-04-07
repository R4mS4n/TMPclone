import { useState } from "react";
import fondo from "../cimages/Bg-geometry.jpg";

const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        mail: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                localStorage.setItem("token", data.token);  // Save JWT
                alert("Registration successful!");
                window.location.href = "/login"; // Redirect user
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
          className="flex items-center justify-center min-h-screen bg-base-200 bg-cover bg-center"
          style={{ backgroundImage: `url(${fondo})` }}
        >
          <div className="w-full max-w-md p-8 space-y-4 shadow-lg bg-base-100 bg-opacity-90 rounded-2xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-center text-primary">Registro</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Nombre de usuario</span>
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Correo electrónico</span>
                </label>
                <input
                  type="email"
                  name="mail"
                  placeholder="Email"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Contraseña</span>
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Registrarse
              </button>
            </form>
            <p className="text-center text-sm text-base-content">
              ¿Ya tienes una cuenta?{" "}
              <a href="/login" className="text-primary hover:underline">
                Inicia sesión
              </a>
            </p>
          </div>
        </div>
      );
    };
    
    export default Register;