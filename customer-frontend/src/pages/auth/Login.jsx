import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import "./Login.css";
import backgroundImage from "../../assets/samplebg.jpg";

const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
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
    try {
      const response = await fetch(
        "http://localhost:4000/api/customers/login",
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

      localStorage.setItem("token", data.token);
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="auth-container login">
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Welcome Back</h2>
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

            <button type="submit" className="submit-btn">
              Login
            </button>

            <p className="auth-link">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
      <div className="login-right">
        <div
          className="login-image"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      </div>
    </div>
  );
};

export default Login;
