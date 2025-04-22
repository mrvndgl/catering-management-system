import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import "./Auth.css";
import Swal from "sweetalert2";
import backgroundImage from "../../assets/samplebg.jpg";

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/reservation"; // Default to reservation

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:4000"
        }/api/customers/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.user || !data.user._id) {
        throw new Error("Invalid user data received");
      }

      // Use login function from context
      login(data.user, data.token);
      localStorage.setItem("userId", data.user._id);

      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        timer: 2000,
        showConfirmButton: false,
      });

      // Redirect to reservation page
      setTimeout(() => {
        navigate(from);
      }, 2000);
    } catch (err) {
      console.error("Login error details:", err);

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.message || "Invalid credentials. Please try again.",
      });

      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="auth-container login">
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Welcome Back!</h2>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="input-field"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Login
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>

            <p className="auth-link">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
      <div
        className="login-image"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
    </div>
  );
};

export default Login;
