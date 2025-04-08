import { useState } from "react";
import { useNavigate } from "react-router-dom";


const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        mail: "",
        password: "",
    });
    
    const [message, setMessage]=useState({text: "", isError: false});
    const [isSubmitting, setIsSubmitting]=useState(false);
    const navigate=useNavigate();
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
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
                setMessage({ 
                    text: "Registration successful! Please check your email to verify your account.", 
                    isError: false 
                });
                // Don't redirect yet - user needs to verify email
            } else {
                setMessage({ 
                    text: data.message || "Registration failed", 
                    isError: true 
                });
            }
        } catch (error) {
            console.error("Registration error:", error);
            setMessage({ 
                text: "Network error. Please try again.", 
                isError: true 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-container">
            <h2>Create Account</h2>
            {message.text && (
                <div className={`message ${message.isError ? "error" : "success"}`}>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    name="username" 
                    placeholder="Username" 
                    value={formData.username}
                    onChange={handleChange} 
                    required 
                />
                <input 
                    type="email" 
                    name="mail" 
                    placeholder="Email (must end with @techmahindra.com)" 
                    value={formData.mail}
                    onChange={handleChange} 
                    required 
                />
                <input 
                    type="password" 
                    name="password" 
                    placeholder="Password (min 8 characters)" 
                    value={formData.password}
                    onChange={handleChange} 
                    required 
                    minLength="8"
                />
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Registering..." : "Register"}
                </button>
            </form>
            <div className="login-redirect">
                Already have an account? <a href="/login">Log in</a>
            </div>
        </div>
    );
};

export default Register;
