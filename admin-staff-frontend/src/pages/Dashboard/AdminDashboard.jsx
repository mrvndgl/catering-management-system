import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../../components/Sidebar/AdminSidebar/AdminSidebar";
import ProductManagement from "../ProductManagement/ProductManagement";
import AdminReservations from "../ViewReservations/AdminReservations";
import FeedbackManagement from "../FeedbackManagement/FeedbackManagement";
import ViewPayment from "../ViewPayment/ViewPayment";
import AdminReports from "../ViewReports/ViewReports";
import ViewAccounts from "../ViewAccounts/ViewAccounts";
import "./AdminDashboard.css";

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

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="dashboard-container">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />
      <Routes>
        <Route path="/" element={<DashboardContent />} />
        <Route path="/dashboard" element={<DashboardContent />} />
        <Route
          path="/products"
          element={
            <PageWrapper title="Product Management">
              <ProductManagement />
            </PageWrapper>
          }
        />
        <Route
          path="/reservations"
          element={
            <PageWrapper title="Reservations">
              <AdminReservations />
            </PageWrapper>
          }
        />
        <Route
          path="/feedback"
          element={
            <PageWrapper title="Customer Feedback">
              <FeedbackManagement />
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
        <Route
          path="/reports"
          element={
            <PageWrapper title="Reports & Analytics">
              <AdminReports />
            </PageWrapper>
          }
        />
        <Route
          path="/accounts"
          element={
            <PageWrapper title="Manage Accounts">
              <ViewAccounts />
            </PageWrapper>
          }
        />
      </Routes>
    </div>
  );
};

export default AdminDashboard;
