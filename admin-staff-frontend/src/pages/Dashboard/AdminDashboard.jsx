import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../../components/Sidebar/AdminSidebar/AdminSidebar";
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
      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route
            path="/reservations"
            element={<div>Reservations Content</div>}
          />
          <Route path="/products" element={<div>Products Content</div>} />
          <Route path="/feedback" element={<div>Feedback Content</div>} />
          <Route path="/payments" element={<div>Payments Content</div>} />
          <Route path="/reports" element={<div>Reports Content</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
