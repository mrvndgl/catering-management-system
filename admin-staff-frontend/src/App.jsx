import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "./context/SidebarContext";
import AdminSidebar from "./components/Sidebar/AdminSidebar/AdminSidebar";
import StaffSidebar from "./components/Sidebar/StaffSidebar/StaffSidebar";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import ProductManagement from "./pages/ProductManagement/ProductManagement";
import AdminReservations from "./pages/ViewReservations/AdminReservations";
import FeedbackManagement from "./pages/FeedbackManagement/FeedbackManagement";
import ViewPayment from "./pages/ViewPayment/ViewPayment";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import StaffDashboard from "./pages/Dashboard/StaffDashboard";
import AdminReports from "./pages/ViewReports/ViewReports";

const App = () => {
  const isAuthenticated = !!localStorage.getItem("token");
  const employeeType = localStorage.getItem("employeeType");

  return (
    <SidebarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSidebar>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="products" element={<ProductManagement />} />
                    <Route
                      path="reservations"
                      element={<AdminReservations />}
                    />
                    <Route path="feedback" element={<FeedbackManagement />} />
                    <Route path="payments" element={<ViewPayment />} />
                    <Route path="reports" element={<AdminReports />} />
                  </Routes>
                </AdminSidebar>
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffSidebar>
                  <Routes>
                    <Route path="dashboard" element={<StaffDashboard />} />
                    {/* Add other staff routes here */}
                  </Routes>
                </StaffSidebar>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  );
};

export default App;
