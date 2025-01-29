import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "./context/SidebarContext";
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
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  );
};

export default App;
