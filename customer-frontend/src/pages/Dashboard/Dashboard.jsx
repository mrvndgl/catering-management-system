import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import mainImage from "../../assets/main.jpg";
import { useSidebar } from "../../context/SidebarContext";
import "./Dashboard.css";

const Dashboard = ({ onLogout }) => {
  const location = useLocation();
  const notification = location.state?.notification;
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();

  return (
    <div
      className={`dashboard-layout ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-container">
        {notification && (
          <div className="notification-message">{notification}</div>
        )}
        <div
          className="header"
          style={{ backgroundImage: `url(${mainImage})` }}
        >
          <div className="header-contents">
            <h2>Create your reservations today.</h2>
            <p>
              At Macky's Food Service, we offer exceptional catering services to
              make your events memorable. Book your reservations now and enjoy
              our delicious meals and excellent service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
