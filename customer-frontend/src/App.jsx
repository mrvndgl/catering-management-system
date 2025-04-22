import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthProvider";
import StoreContextProvider from "./context/StoreContext";
import Navbar from "./components/Navbar/Navbar";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import HomePage from "./components/HomePage/HomePage";
import Reservation from "./pages/Reservation/Reservation";
import Schedules from "./pages/Schedules/Schedules";
import Payment from "./pages/Payment/Payment";
import Feedback from "./pages/Feedback/Feedback";
import Footer from "./components/Footer/Footer";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/translucent.css";

// Auth check for routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

// Layout with navbar for authenticated pages
const AuthenticatedLayout = ({ children }) => {
  return (
    <div className="authenticated-layout">
      <Navbar />
      <div className="main-content">{children}</div>
      <Footer />
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.error("ErrorBoundary caught an error:", error);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }

    return this.props.children;
  }
}

const AppContent = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes with navbar */}
      <Route
        path="/reservation"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Reservation />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/schedules"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Schedules />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Payment />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Feedback />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreContextProvider>
          <AppContent />
        </StoreContextProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
