import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import StaffSidebar from "../../components/Sidebar/StaffSidebar/StaffSidebar";
import StaffReservations from "../ViewReservations/StaffReservations";
import ViewPayment from "../ViewPayment/ViewPayment";
import "./StaffDashboard.css";

const DashboardContent = () => (
  <div className="main-content">
    <div className="main-header">
      <h1 className="page-title">Dashboard Overview</h1>
    </div>
    <div className="content-area">
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
    </div>
  </div>
);

const PageWrapper = ({ title, children }) => (
  <div className="main-content">
    <div className="main-header">
      <h1 className="page-title">{title}</h1>
    </div>
    <div className="content-area">{children}</div>
  </div>
);

const StaffDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="dashboard-container">
      <StaffSidebar activePage={activePage} setActivePage={setActivePage} />
      <Routes>
        <Route path="/" element={<DashboardContent />} />
        <Route path="/dashboard" element={<DashboardContent />} />
        <Route
          path="/reservations"
          element={
            <PageWrapper title="Manage Reservations">
              <StaffReservations />
            </PageWrapper>
          }
        />
        <Route
          path="/payments"
          element={
            <PageWrapper title="Payment History">
              <ViewPayment />
            </PageWrapper>
          }
        />
      </Routes>
    </div>
  );
};

export default StaffDashboard;
