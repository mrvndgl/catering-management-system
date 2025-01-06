import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import ProductManagement from "./pages/ProductManagement/ProductManagement";
import AdminReservations from "./pages/ViewReservations/AdminReservations";
import FeedbackManagement from "./pages/FeedbackManagement/FeedbackManagement";
import ViewPayment from "./pages/ViewPayment/ViewPayment";
import ProtectedRoute from "./pages/auth/ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/reservations" element={<AdminReservations />} />
        <Route path="/admin/feedback" element={<FeedbackManagement />} />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <ViewPayment />
            </ProtectedRoute>
          }
        />
        <Route path="/staff/dashboard" element={<div>Staff Dashboard</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
