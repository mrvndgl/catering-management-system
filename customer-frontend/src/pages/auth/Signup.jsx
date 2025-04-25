import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import "./Auth.css";
import "./Signup.css";
import Swal from "sweetalert2";
import backgroundImage from "../../assets/samplebg.jpg";

const Signup = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    contactNumber: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: "Passwords do not match",
      });
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:4000"
        }/api/customers/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      setSuccess("Account created successfully! Redirecting...");

      // Use login function from context
      login(data.user, data.token);
      localStorage.setItem("userId", data.user._id);

      Swal.fire({
        icon: "success",
        title: "Account Created",
        text: "Redirecting to reservation...",
        timer: 2000,
        showConfirmButton: false,
      });

      // Direct to reservation after signup
      setTimeout(() => {
        navigate("/reservation");
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed");

      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: err.message || "An error occurred. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className="login-page signup">
      <div className="login-left">
        <div className="auth-container compact">
          <form
            onSubmit={handleSubmit}
            className="auth-form compact-form"
            autoComplete="off"
          >
            <h2>Create Account</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* First row: First Name and Last Name */}
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="input-field compact-input"
                  autoComplete="given-name"
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="input-field compact-input"
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Second row: Username and Contact Number */}
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="input-field compact-input"
                  autoComplete="username"
                  spellCheck="false"
                />
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="input-field compact-input"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Third row: Address (full width) */}
            <div className="form-row full-width">
              <div className="form-group">
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="input-field compact-input"
                  autoComplete="street-address"
                />
              </div>
            </div>

            {/* Fourth row: Email (full width) */}
            <div className="form-row full-width">
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field compact-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Fifth row: Password and Confirm Password */}
            <div className="form-row">
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field compact-input"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input-field compact-input"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn compact-btn">
                Sign Up
              </button>
              <button
                type="button"
                className="cancel-btn compact-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>

            <p className="auth-link compact-link">
              Already have an account?{" "}
              <Link
                to="/login"
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                Login
              </Link>
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

export default Signup;
