import React, { useState } from "react";
import { useSidebar } from "../../context/SidebarContext";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Utensils,
  CreditCard,
  CalendarCheck,
  MessageSquare,
  Menu,
  LogOut,
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = () => {
  const { isSidebarCollapsed, setIsSidebarCollapsed, handleLogout } =
    useSidebar();

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/reservation",
      label: "Create Reservation",
      icon: CalendarCheck,
    },
    {
      path: "/payment",
      label: "Manage Payment",
      icon: CreditCard,
    },
    {
      path: "/schedules",
      label: "Reservations",
      icon: Utensils,
    },
    {
      path: "/feedback",
      label: "Send Feedback",
      icon: MessageSquare,
    },
  ];

  return (
    <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          {!isSidebarCollapsed && <h2>Dashboard</h2>}
          <button
            className="toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${
                    isSidebarCollapsed ? "collapsed" : ""
                  }`}
                >
                  <item.icon size={20} className="nav-icon" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className={`logout-btn ${isSidebarCollapsed ? "collapsed" : ""}`}
        >
          <LogOut size={20} className="nav-icon" />
          {!isSidebarCollapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
