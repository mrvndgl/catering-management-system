import React, { useState } from "react";
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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="public-home">
      <div className="auth-links">
        {!isAuthenticated && (
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
        )}
      </div>
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
