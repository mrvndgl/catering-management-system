import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StaffDashboard.css";

const StaffDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Catering Staff</h2>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="toggle-button"
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => setActivePage("dashboard")}
            className={`nav-button ${
              activePage === "dashboard" ? "active" : ""
            }`}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => setActivePage("reservations")}
            className={`nav-button ${
              activePage === "reservations" ? "active" : ""
            }`}
          >
            📅 Reservations
          </button>

          <button
            onClick={() => setActivePage("payments")}
            className={`nav-button ${
              activePage === "payments" ? "active" : ""
            }`}
          >
            💰 Payments
          </button>
        </nav>

        <button className="logout-button">🚪 Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <h1 className="page-title">
            {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
          </h1>
        </header>
      </div>
    </div>
  );
};

export default StaffDashboard;
