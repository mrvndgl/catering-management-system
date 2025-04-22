import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import Swal from "sweetalert2";
import {
  LayoutDashboard,
  Utensils,
  CreditCard,
  CalendarCheck,
  MessageSquare,
  Menu,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import logoImage from "../../assets/cmslogo2.png";
import "./Navbar.css";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  // Menu items for authenticated users
  const authMenuItems = [
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

  // Menu items for non-authenticated users
  const publicMenuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openLogoutConfirm = () => {
    Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to log out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };

  const handleLogout = () => {
    Toast.fire({
      icon: "success",
      title: "Logged out successfully",
    });

    setTimeout(() => {
      logout();
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <NavLink to="/dashboard">
            <img src={logoImage} alt="Logo" className="logo-image" />
          </NavLink>
        </div>
        <button className="menu-toggle" onClick={toggleMenu}>
          <Menu size={20} />
        </button>

        <div className={`navbar-menu ${isMenuOpen ? "open" : ""}`}>
          <ul className="nav-list">
            {/* Show different menu items based on authentication status */}
            {(isAuthenticated ? authMenuItems : publicMenuItems).map((item) => (
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

            {/* Authentication buttons */}
            {isAuthenticated ? (
              <li className="nav-item logout-item">
                <button onClick={openLogoutConfirm} className="logout-btn">
                  <LogOut size={20} className="nav-icon" />
                  <span>Log out</span>
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">
                    <LogIn size={20} className="nav-icon" />
                    <span>Login</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/signup" className="nav-link">
                    <UserPlus size={20} className="nav-icon" />
                    <span>Sign Up</span>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
