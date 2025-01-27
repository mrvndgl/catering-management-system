import React from "react";
import { useNavigate } from "react-router-dom";
import "./StaffSidebar.css";

const StaffSidebar = ({
  navItems,
  activePage,
  setActivePage,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  handleLogoutClick,
}) => {
  const navigate = useNavigate();

  const handleButtonClick = (section) => {
    setActivePage(section);
    const item = navItems.find((item) => item.id === section);
    if (item) {
      navigate(item.path);
    }
  };

  return (
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
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleButtonClick(item.id)}
            className={`nav-button ${activePage === item.id ? "active" : ""}`}
          >
            {item.icon}
            {!isSidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <button className="logout-button" onClick={handleLogoutClick}>
        🚪
        {!isSidebarCollapsed && <span>Logout</span>}
      </button>
    </div>
  );
};

export default StaffSidebar;
