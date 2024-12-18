import React from "react";
import { useLocation } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const location = useLocation();
  const notification = location.state?.notification;

  return (
    <div>
      {notification && (
        <div className="notification-message">{notification}</div>
      )}
      <div className="header">
        <div className="header-contents">
          <h2>Create your reservations today.</h2>
          <p>
            At Macky's Food Service, we offer exceptional catering for any
            event. Our expert chefs create customized menus with the finest
            ingredients, and our professional staff ensures seamless service.
            Reserve today for a perfect blend of taste and elegance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
