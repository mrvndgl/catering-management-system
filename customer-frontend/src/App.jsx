import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Sidebar from "./components/Sidebar/Sidebar";
import Reservation from "./pages/Reservation/Reservation";
import Schedules from "./pages/Schedules/Schedules";
import "./App.css";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      console.log("Current token:", token);

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const isValid = payload.exp * 1000 > Date.now();
          setIsAuthenticated(isValid);
        } catch (e) {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <div className="app">
      {(location.pathname === "/dashboard" ||
        location.pathname === "/reservation" ||
        location.pathname === "/schedules") && (
        <Sidebar onLogout={handleLogout} />
      )}
      <div className="main-container">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login setIsAuthenticated={setIsAuthenticated} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Signup setIsAuthenticated={setIsAuthenticated} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" replace state={{ from: location }} />
              )
            }
          />
          <Route
            path="/reservation"
            element={
              isAuthenticated ? (
                <Reservation />
              ) : (
                <Navigate to="/login" replace state={{ from: location }} />
              )
            }
          />
          <Route
            path="/schedules"
            element={
              isAuthenticated ? (
                <Schedules />
              ) : (
                <Navigate to="/login" replace state={{ from: location }} />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
