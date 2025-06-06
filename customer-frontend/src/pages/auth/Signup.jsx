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
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Input validation based on field type
    if (name === "firstName" || name === "lastName") {
      // Only allow letters and spaces for names
      if (value && !/^[A-Za-z\s]*$/.test(value)) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Input",
          text: `${
            name === "firstName" ? "First" : "Last"
          } name should only contain letters and spaces`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return; // Don't update the state with invalid input
      }
    } else if (name === "username") {
      // For username, allow only letters, numbers, underscores, and hyphens
      if (value && !/^[A-Za-z0-9_-]*$/.test(value)) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Input",
          text: "Username should only contain letters, numbers, underscores, and hyphens",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return; // Don't update the state with invalid input
      }
    } else if (name === "contactNumber") {
      // Only allow digits
      const sanitizedValue = value.replace(/[^\d]/g, "");
      // Limit to 11 digits
      const truncatedValue = sanitizedValue.slice(0, 11);
      setFormData({
        ...formData,
        [name]: truncatedValue,
      });
      return; // Early return since we've already updated the state
    } else if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }

    // Update state for all other fields or valid inputs
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateName = (name, fieldName) => {
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return `${fieldName} should only contain letters and spaces`;
    }
    return null;
  };

  const validateUsername = (username) => {
    // Allow only letters, numbers, underscores, and hyphens
    if (!/^[A-Za-z0-9_-]+$/.test(username)) {
      return "Username should only contain letters, numbers, underscores, and hyphens";
    }
    return null;
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (!hasUpperCase) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!hasLowerCase) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!hasNumber) {
      errors.push("Password must contain at least one number");
    }
    if (!hasSpecialChar) {
      errors.push("Password must contain at least one special character");
    }

    if (errors.length > 0) {
      return errors.join("<br>");
    }
    return "";
  };

  const validateContactNumber = (number) => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPasswordError("");

    // Collect all validation errors
    const errors = [];

    // Validate names
    const firstNameError = validateName(formData.firstName, "First name");
    if (firstNameError) errors.push(firstNameError);

    const lastNameError = validateName(formData.lastName, "Last name");
    if (lastNameError) errors.push(lastNameError);

    // Validate username
    const usernameError = validateUsername(formData.username);
    if (usernameError) errors.push(usernameError);

    // Validate contact number
    if (!validateContactNumber(formData.contactNumber)) {
      errors.push(
        "Please enter a valid Philippine mobile number (11 digits starting with '09')"
      );
    }

    // Validate password format
    const passwordValidationError = validatePassword(formData.password);
    if (passwordValidationError) {
      errors.push(passwordValidationError);
      setPasswordError(passwordValidationError);
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
      setPasswordError("Passwords do not match");
    }

    // If there are validation errors, show them and return
    if (errors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        html: errors.join("<br>"),
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
            {passwordError && (
              <div className="error-message">{passwordError}</div>
            )}

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
                  placeholder="Password (A-Z, a-z, 0-9, !@#$)"
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
