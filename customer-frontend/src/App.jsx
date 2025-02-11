import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import Sidebar from "./components/Sidebar/Sidebar";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Reservation from "./pages/Reservation/Reservation";
import Schedules from "./pages/Schedules/Schedules";
import Payment from "./pages/Payment/Payment";
import Feedback from "./pages/Feedback/Feedback";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/translucent.css";

const DashboardLayout = ({ children }) => {
  const { isSidebarCollapsed } = useSidebar();
  console.log(
    "DashboardLayout rendered, isSidebarCollapsed:",
    isSidebarCollapsed
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div
        className={`dashboard-container ${
          isSidebarCollapsed ? "collapsed-sidebar" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSidebar();
  const location = useLocation();

  console.log("ProtectedRoute state:", {
    isAuthenticated,
    loading,
    currentPath: location.pathname,
  });

  if (loading) {
    console.log("ProtectedRoute: Loading state");
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log("ProtectedRoute: Rendering protected content");
  return children;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error);
    console.error("Error info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "red" }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  console.log("App component rendering");

  return (
    <ErrorBoundary>
      <SidebarProvider>
        {console.log("SidebarProvider rendered")}
        <Routes>
          {console.log("Routes component rendering")}
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <ErrorBoundary>
                <Login />
              </ErrorBoundary>
            }
          />
          <Route
            path="/signup"
            element={
              <ErrorBoundary>
                <Signup />
              </ErrorBoundary>
            }
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route
                        index
                        element={<Navigate to="/dashboard" replace />}
                      />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="reservation" element={<Reservation />} />
                      <Route path="schedules" element={<Schedules />} />
                      <Route path="payment" element={<Payment />} />
                      <Route path="feedback" element={<Feedback />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
        </Routes>
      </SidebarProvider>
    </ErrorBoundary>
  );
};

export default App;
