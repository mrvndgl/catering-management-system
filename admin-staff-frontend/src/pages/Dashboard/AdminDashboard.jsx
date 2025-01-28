// AdminDashboard.js
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../../components/Sidebar/AdminSidebar/AdminSidebar";
import ProductManagement from "../ProductManagement/ProductManagement";
import AdminReservations from "../ViewReservations/AdminReservations";
import FeedbackManagement from "../FeedbackManagement/FeedbackManagement";
import ViewPayment from "../ViewPayment/ViewPayment";
import AdminReports from "../ViewReports/ViewReports";
import "./AdminDashboard.css";

const DashboardContent = () => (
  <div className="dashboard-grid">
    <div className="dashboard-card">
      <div className="stat-card">
        <div className="stat-icon">📋</div>
        <div className="stat-content">
          <h3>Total Reservations</h3>
          <p className="stat-number">150</p>
          <p className="stat-label">Active Bookings</p>
        </div>
      </div>
    </div>
    <div className="dashboard-card">
      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-content">
          <h3>Revenue</h3>
          <p className="stat-number">₱25,000</p>
          <p className="stat-label">This Month</p>
        </div>
      </div>
    </div>
    <div className="dashboard-card">
      <div className="stat-card">
        <div className="stat-icon">🍽️</div>
        <div className="stat-content">
          <h3>Products</h3>
          <p className="stat-number">45</p>
          <p className="stat-label">Active Items</p>
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="admin-dashboard">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="dashboard-main">
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route path="/dashboard" element={<DashboardContent />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/reservations" element={<AdminReservations />} />
          <Route path="/feedback" element={<FeedbackManagement />} />
          <Route path="/payments" element={<ViewPayment />} />
          <Route path="/reports" element={<AdminReports />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
