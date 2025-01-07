import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Sidebar from "./components/Sidebar/Sidebar";
import Reservation from "./pages/Reservation/Reservation";
import Schedules from "./pages/Schedules/Schedules";
import Payment from "./pages/Payment/Payment";
import Feedback from "./pages/Feedback/Feedback";
import "./App.css";

const ProtectedRoute = ({ children, isAuthenticated }) => {
  const location = useLocation();
  return !isAuthenticated ? (
    <Navigate to="/login" replace state={{ from: location }} />
  ) : (
    <div className="dashboard-layout">
      <Sidebar
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
      />
      <div className="dashboard-container">{children}</div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Assume validateToken is a function that validates the token
          const isValid = await validateToken(token);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="app">
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
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservation"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Reservation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Schedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Feedback />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
