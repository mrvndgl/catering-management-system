import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ onLogout }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2>Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="/reservation">Create Reservation</Link>
            </li>
            <li>
              <Link to="/payment">Manage Payment</Link>
            </li>
            <li>
              <Link to="/schedules">Scheduled Reservations</Link>
            </li>
            <li>
              <Link to="/feedback">Send Feedback</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-btn">
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
