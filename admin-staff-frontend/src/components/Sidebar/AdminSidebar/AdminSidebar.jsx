import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../../context/SidebarContext";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activePage, setActivePage] = useState("dashboard"); // Add this line

  const navItems = [
    {
      id: "dashboard",
      icon: "📊",
      label: "Dashboard",
      path: "/admin/dashboard",
    },
    {
      id: "reservations",
      icon: "📋",
      label: "Reservations",
      path: "/admin/reservations",
    },
    {
      id: "payment",
      icon: "💳",
      label: "Payments",
      path: "/admin/payments",
    },
    {
      id: "products",
      icon: "🍽️",
      label: "Products",
      path: "/admin/products",
    },
    {
      id: "feedback",
      icon: "💬",
      label: "Feedback",
      path: "/admin/feedback",
    },
    {
      id: "reports",
      icon: "📈",
      label: "Reports",
      path: "/admin/reports",
    },
  ];

  const handleButtonClick = (section) => {
    const item = navItems.find((item) => item.id === section);
    if (item) {
      setActivePage(section); // Now this will work
      navigate(item.path);
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

  return (
    <>
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

      <div
        className={`dashboard-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-toggle">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="toggle-btn"
          >
            ☰
          </button>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleButtonClick(item.id)}
              className={`nav-link ${activePage === item.id ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isSidebarCollapsed && (
                <span className="nav-text">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <button className="nav-link logout-link" onClick={handleLogoutClick}>
          <span className="nav-icon">🚪</span>
          {!isSidebarCollapsed && <span className="nav-text">Logout</span>}
        </button>
      </div>
    </>
  );
};

export default AdminSidebar;
