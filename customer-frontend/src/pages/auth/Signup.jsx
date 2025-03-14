import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import "./Signup.css";
import backgroundImage from "../../assets/samplebg.jpg";

const Signup = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    contactNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
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
      localStorage.setItem("token", data.token);
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  return (
    <div className="login-page signup">
      <div className="login-left">
        <div className="auth-container compact">
          <form onSubmit={handleSubmit} className="auth-form compact-form">
            <h2>Create Account</h2>
            {error && <div className="error-message">{error}</div>}

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
