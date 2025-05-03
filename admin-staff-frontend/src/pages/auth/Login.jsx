import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear pre-filled values when component mounts
  useEffect(() => {
    // Clear form fields on component mount
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    if (usernameInput) usernameInput.value = "";
    if (passwordInput) passwordInput.value = "";

    // Update the React state to match
    setFormData({
      username: "",
      password: "",
    });
  }, []);

  // Configure the Toast notification
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  // Simplified handleChange function
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:4000/api/employees/login",
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

      localStorage.setItem("token", data.token);
      localStorage.setItem("employeeType", data.employeeType);

      // Show success toast notification
      Toast.fire({
        icon: "success",
        title: "Signed in successfully",
      });

      // Navigate after showing the toast
      setTimeout(() => {
        if (data.employeeType === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/staff/dashboard");
        }
      }, 1000); // Short delay to see the toast before navigation
    } catch (err) {
      // Show error toast notification instead of error state
      Toast.fire({
        icon: "error",
        title: err.message || "Login failed",
      });
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>Management Portal</h2>

          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="form-group">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                autoComplete="new-username"
              />
            </div>

            {/* Password Input */}
            <div className="form-group">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                autoComplete="new-password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Adding a spacer to maintain height without the sign up section */}
          <div className="spacer"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
