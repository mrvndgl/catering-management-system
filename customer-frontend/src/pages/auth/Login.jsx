import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import "./Auth.css";
import Swal from "sweetalert2";
import backgroundImage from "../../assets/samplebg.jpg";

const Login = () => {
  const formRef = useRef(null);
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/reservation"; // Default to reservation
  const [formKey, setFormKey] = useState(Date.now());

  // Add this enhanced useEffect hook
  useEffect(() => {
    // Function to clear autofill
    const clearAutofill = () => {
      console.log("Attempting to clear autofill...");

      // Force a form reset
      if (formRef.current) {
        formRef.current.reset();
      }

      // Try to clear using DOM manipulation
      const usernameInput = document.getElementById("username-field");
      const passwordInput = document.getElementById("password-field");

      if (usernameInput) {
        usernameInput.value = "";
        usernameInput.setAttribute("autocomplete", "new-username");
      }

      if (passwordInput) {
        passwordInput.value = "";
        passwordInput.setAttribute("autocomplete", "new-password");
      }

      // Reset React state
      setFormData({
        username: "",
        password: "",
      });

      // Force form refresh by updating key
      setFormKey(Date.now());
    };

    // Initial clear
    clearAutofill();

    // Add a secondary delayed clear to catch late autofills
    const timer = setTimeout(clearAutofill, 500);

    // Clean up
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    // Map input names to state properties
    const fieldName =
      e.target.name === "username_input"
        ? "username"
        : e.target.name === "password_input"
        ? "password"
        : e.target.name;

    setFormData({
      ...formData,
      [fieldName]: e.target.value,
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
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
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
    <div className="login-page" key={`login-container-${formKey}`}>
      {/* Hidden form to "catch" browser autofill */}
      <div
        style={{
          height: 0,
          width: 0,
          overflow: "hidden",
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
        }}
      >
        <form id="decoy-form" aria-hidden="true">
          <input type="text" name="username" autoComplete="username" />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
          />
        </form>
      </div>

      <div className="login-left">
        <div className="auth-container login">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="auth-form"
            autoComplete="off"
            key={`login-form-${formKey}`}
          >
            <h2>Welcome Back!</h2>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <input
                id="username-field"
                name="username_input"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                autoComplete="new-username"
                className="input-field"
                autoFocus
              />
            </div>

            <div className="form-group">
              <input
                id="password-field"
                type="password"
                name="password_input"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
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
