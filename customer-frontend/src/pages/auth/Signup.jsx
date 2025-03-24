import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider"; // Import useAuth
import "./Auth.css";
import "./Signup.css";
import Swal from "sweetalert2";
import backgroundImage from "../../assets/samplebg.jpg";

const Signup = () => {
  const { setIsAuthenticated } = useAuth(); // Get from context instead of props
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
  const [success, setSuccess] = useState(""); // Add success message state
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
        `${import.meta.env.VITE_API_URL}/api/customers/signup`,
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

      Swal.fire({
        icon: "success",
        title: "Account Created",
        text: "Redirecting to login...",
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => {
        navigate("/login");
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

  return (
    <div className="login-page signup">
      <div className="login-left">
        <div className="auth-container compact">
          <form onSubmit={handleSubmit} className="auth-form compact-form">
            <h2>Create Account</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input-field compact-input"
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
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-field compact-input"
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
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
                className="input-field compact-input"
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field compact-input"
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
                className="input-field compact-input"
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
              />
            </div>

            <button type="submit" className="submit-btn compact-btn">
              Sign Up
            </button>

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
