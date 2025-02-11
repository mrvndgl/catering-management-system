import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useSidebar } from "../../../context/SidebarContext";
import "./StaffSidebar.css";

const StaffSidebar = ({ activePage, setActivePage }) => {
  const navigate = useNavigate();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/staff/dashboard",
    },
    {
      id: "reservations",
      icon: ClipboardList,
      label: "Reservations",
      path: "/staff/reservations",
    },
    {
      id: "payments",
      icon: CreditCard,
      label: "Payments",
      path: "/staff/payments",
    },
  ];

  const handleButtonClick = (section) => {
    const item = navItems.find((item) => item.id === section);
    if (item) {
      setActivePage(section);
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

        <div className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleButtonClick(item.id)}
              className={`nav-link ${activePage === item.id ? "active" : ""}`}
            >
              <span className="nav-icon">
                <item.icon size={20} strokeWidth={1.5} />
              </span>
              {!isSidebarCollapsed && (
                <span className="nav-text">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        <button className="nav-link logout-link" onClick={handleLogoutClick}>
          <span className="nav-icon">
            <LogOut size={20} strokeWidth={1.5} />
          </span>
          {!isSidebarCollapsed && <span className="nav-text">Logout</span>}
        </button>
      </div>
    </>
  );
};

export default StaffSidebar;
