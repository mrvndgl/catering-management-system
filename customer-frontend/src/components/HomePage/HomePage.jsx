import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import Dashboard from "../../pages/Dashboard/Dashboard";
import ExploreService from "../ExploreService/ExploreService";
import ExploreMenu from "../ExploreMenu/ExploreMenu";
import FoodDisplay from "../FoodDisplay/FoodDisplay";
import CustomerFeedback from "../CustomerFeedback/CustomerFeedback";
import Footer from "../Footer/Footer";
import "./HomePage.css";

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Force re-render when auth state changes
  useEffect(() => {
    console.log("Auth state in HomePage:", isAuthenticated);
  }, [isAuthenticated]);

  return (
    <div className="public-home">
      <div className="auth-links">
        {!isAuthenticated ? (
          <div className="auth-buttons">
            <button onClick={() => navigate("/login")} className="login-button">
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="signup-button"
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="welcome-message">
            Welcome, {user?.firstName || user?.username || "User"}!
            <button
              onClick={() => navigate("/reservation")}
              className="reservation-button"
            >
              Make a Reservation
            </button>
          </div>
        )}
      </div>

      {/* Consider what Dashboard does and if it should be conditional */}
      <Dashboard />
      <ExploreService />
      <ExploreMenu
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <FoodDisplay category={selectedCategory} />
      <CustomerFeedback />
      <Footer />
    </div>
  );
};

export default HomePage;
