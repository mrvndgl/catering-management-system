import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Utensils,
  MessageSquare,
  BarChart3,
  Users,
  LogOut,
  Menu,
  CalendarCheck2,
} from "lucide-react";
import { useSidebar } from "../../../context/SidebarContext";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  // Configure SweetAlert Toast
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

  const navItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
    },
    {
      id: "reservations",
      icon: ClipboardList,
      label: "Reservations",
      path: "/admin/reservations",
    },
    {
      id: "schedules",
      icon: CalendarCheck2,
      label: "Schedules",
      path: "/admin/schedules",
    },
    {
      id: "payment",
      icon: CreditCard,
      label: "Payments",
      path: "/admin/payments",
    },
    {
      id: "products",
      icon: Utensils,
      label: "Products",
      path: "/admin/products",
    },
    {
      id: "feedback",
      icon: MessageSquare,
      label: "Feedback",
      path: "/admin/feedback",
    },
    {
      id: "reports",
      icon: BarChart3,
      label: "Reports",
      path: "/admin/reports",
    },
    {
      id: "accounts",
      icon: Users,
      label: "Accounts",
      path: "/admin/accounts",
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
    // Replace modal with SweetAlert2 confirmation
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
        confirmLogout();
      }
    });
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employeeType");

    // Show success toast notification
    Toast.fire({
      icon: "success",
      title: "Logged out successfully",
    });

    // Navigate after a short delay to show the toast
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <div
        className={`dashboard-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-toggle">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="toggle-btn"
          >
            <Menu />
          </button>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleButtonClick(item.id)}
                className={`nav-link ${activePage === item.id ? "active" : ""}`}
              >
                <span className="nav-icon">
                  <IconComponent size={20} strokeWidth={1.5} />
                </span>
                {!isSidebarCollapsed && (
                  <span className="nav-text">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

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

export default AdminSidebar;
