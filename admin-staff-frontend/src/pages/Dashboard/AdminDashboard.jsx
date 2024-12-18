import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const handleButtonClick = (section) => {
    setActiveSection(section);
    switch (section) {
      case "products":
        navigate("/admin/products");
        break;
      case "reservations":
        navigate("/admin/reservations");
        break;
      case "payment":
        navigate("/admin/payments");
        break;
      case "feedback":
        navigate("/admin/feedback");
        break;
      case "reports":
        navigate("/admin/reports");
        break;
      default:
        console.log(`No route defined for section: ${section}`);
    }
  };

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

  const dashboardButtons = [
    {
      id: "order-reservation",
      icon: "📋",
      label: "Manage Order Reservation",
      onClick: () => handleButtonClick("reservations"),
    },
    {
      id: "payment",
      icon: "💳",
      label: "Manage Payment",
      onClick: () => handleButtonClick("payment"),
    },
    {
      id: "products",
      icon: "🍽️",
      label: "Manage Products",
      onClick: () => handleButtonClick("products"),
    },
    {
      id: "feedback",
      icon: "💬",
      label: "Manage Customer Feedback",
      onClick: () => handleButtonClick("feedback"),
    },
    {
      id: "reports",
      icon: "📊",
      label: "Generate Reports",
      onClick: () => handleButtonClick("reports"),
    },
  ];

  return (
    <div className="admin-dashboard">
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

      <header className="dashboard-header">
        <h1>Catering Management System - Admin Panel</h1>
        <div className="user-info">
          <span>Admin</span>
          <button className="logout-btn" onClick={handleLogoutClick}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          {dashboardButtons.map((button) => (
            <div key={button.id} className="dashboard-card">
              <button
                className={`dashboard-button ${button.id}`}
                onClick={button.onClick}
              >
                <i className="icon">{button.icon}</i>
                <span>{button.label}</span>
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
