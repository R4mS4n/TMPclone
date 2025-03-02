import { useState } from "react";

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
                window.location.href = "/dashboard"; // Redirect user
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("error registering user: ", error);
            alert("Error registering user");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
            <input type="email" name="mail" placeholder="Email" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;

