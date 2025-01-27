import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/StaffSidebar/StaffSidebar";
import "./StaffDashboard.css";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    {
      id: "dashboard",
      icon: "📊",
      label: "Dashboard",
      path: "/staff/dashboard",
    },
    {
      id: "reservations",
      icon: "📅",
      label: "Reservations",
      path: "/staff/reservations",
    },
    {
      id: "payments",
      icon: "💰",
      label: "Payments",
      path: "/staff/payments",
    },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employeeType");
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="dashboard-container">
      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to log out?</p>
            <div className="logout-modal-actions">
              <button className="logout-confirm-btn" onClick={confirmLogout}>
                Yes, Logout
              </button>
              <button className="logout-cancel-btn" onClick={cancelLogout}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        activePage={activePage}
        setActivePage={setActivePage}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        handleLogoutClick={handleLogoutClick}
      />

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <h1 className="page-title">
            {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
          </h1>
        </header>
        <div className="content-area">
          {/* Page-specific content will be rendered here */}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
