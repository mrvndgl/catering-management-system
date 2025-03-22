import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import {
  LayoutDashboard,
  Utensils,
  CreditCard,
  CalendarCheck,
  MessageSquare,
  Menu,
  LogOut,
} from "lucide-react";
import logoImage from "../../assets/mainLogo.png";
import "./Navbar.css";

const Navbar = () => {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/reservation",
      label: "Reserve",
      icon: CalendarCheck,
    },
    {
      path: "/payment",
      label: "Payment",
      icon: CreditCard,
    },
    {
      path: "/schedules",
      label: "Schedules",
      icon: Utensils,
    },
    {
      path: "/feedback",
      label: "Feedback",
      icon: MessageSquare,
    },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const closeLogoutConfirm = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={logoImage} alt="Logo" className="logo-image" />
        </div>
        <button className="menu-toggle" onClick={toggleMenu}>
          <Menu size={20} />
        </button>

        <div className={`navbar-menu ${isMenuOpen ? "open" : ""}`}>
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <item.icon size={20} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
            <li className="nav-item logout-item">
              <button onClick={openLogoutConfirm} className="logout-btn">
                <LogOut size={20} className="nav-icon" />
                <span>Log out</span>
              </button>
            </li>
          </ul>
        </div>

        {showLogoutConfirm && (
          <div className="logout-confirm-overlay">
            <div className="logout-confirm-dialog">
              <h2>Confirm Logout</h2>
              <p>Are you sure you want to log out?</p>
              <div className="logout-dialog-buttons">
                <button className="confirm-btn" onClick={handleLogout}>
                  Yes, Logout
                </button>
                <button className="cancel-btn" onClick={closeLogoutConfirm}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
