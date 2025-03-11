import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthProvider";
import Navbar from "./components/Navbar/Navbar";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Reservation from "./pages/Reservation/Reservation";
import Schedules from "./pages/Schedules/Schedules";
import Payment from "./pages/Payment/Payment";
import Feedback from "./pages/Feedback/Feedback";
import ExploreService from "./components/ExploreService/ExploreService";
import ExploreMenu from "./components/ExploreMenu/ExploreMenu";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/translucent.css";

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-content">{children}</div>
    </div>
  );
};

// Use useAuth in ProtectedRoute
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
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

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Routes remain the same */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route
                      path="dashboard"
                      element={
                        <div>
                          <Dashboard />
                          <ExploreService />
                          <ExploreMenu />
                        </div>
                      }
                    />

                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="reservation" element={<Reservation />} />
                    <Route path="schedules" element={<Schedules />} />
                    <Route path="payment" element={<Payment />} />
                    <Route path="feedback" element={<Feedback />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
