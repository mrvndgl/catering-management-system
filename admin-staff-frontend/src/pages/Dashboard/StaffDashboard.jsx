import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import StaffSidebar from "../../components/Sidebar/StaffSidebar/StaffSidebar";
import StaffReservations from "../ViewReservations/StaffReservations";
import ViewPayment from "../ViewPayment/ViewPayment";
import { ClipboardList, CreditCard, Utensils } from "lucide-react";
import "./StaffDashboard.css";
import ProductManagement from "../ProductManagement/ProductManagement";
import { useSidebar } from "../../context/SidebarContext";
import axios from "axios";

const DashboardContent = ({ isSidebarCollapsed }) => {
  const [acceptedReservations, setAcceptedReservations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Get auth token from localStorage
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("No authentication token found");
          setIsLoading(false);
          return;
        }

        // Fetch accepted reservations with auth token
        const reservationsResponse = await axios.get(
          "/api/reservations/accepted",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAcceptedReservations(reservationsResponse.data.length);

        // Calculate total revenue from accepted reservations
        let revenue = 0;
        reservationsResponse.data.forEach((reservation) => {
          if (
            reservation.total_amount &&
            reservation.payment_status === "paid"
          ) {
            revenue += parseFloat(reservation.total_amount);
          }
        });

        setTotalRevenue(revenue);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set default values if fetch fails
        setAcceptedReservations(0);
        setTotalRevenue(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className={`main-content ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="main-header">
        <h1 className="page-title">Dashboard Overview</h1>
      </div>
      <div className="content-area">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="stat-card">
              <div className="stat-icon">
                <ClipboardList size={50} color="#ffffff" />
              </div>
              <div className="stat-content">
                <h3>Total Reservations</h3>
                <p className="stat-number">
                  {isLoading ? "Loading..." : acceptedReservations}
                </p>
                <p className="stat-label">Accepted Bookings</p>
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="stat-card">
              <div className="stat-icon">
                <CreditCard size={50} color="#ffffff" />
              </div>
              <div className="stat-content">
                <h3>Revenue</h3>
                <p className="stat-number">
                  {isLoading
                    ? "Loading..."
                    : `₱${totalRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </p>
                <p className="stat-label">From Reservations</p>
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="stat-card">
              <div className="stat-icon">
                <Utensils size={50} color="#ffffff" />
              </div>
              <div className="stat-content">
                <h3>Products</h3>
                <p className="stat-number">41</p>
                <p className="stat-label">Active Items</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PageWrapper = ({ title, children }) => {
  const { isSidebarCollapsed } = useSidebar();
  return (
    <div className={`main-content ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="main-header">
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="content-area">{children}</div>
    </div>
  );
};

const StaffDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const { isSidebarCollapsed } = useSidebar();

  return (
    <div className="dashboard-container">
      <StaffSidebar activePage={activePage} setActivePage={setActivePage} />
      <Routes>
        <Route
          path="/"
          element={<DashboardContent isSidebarCollapsed={isSidebarCollapsed} />}
        />
        <Route
          path="/dashboard"
          element={<DashboardContent isSidebarCollapsed={isSidebarCollapsed} />}
        />
        <Route
          path="/reservations"
          element={
            <PageWrapper title="Manage Reservations">
              <StaffReservations />
            </PageWrapper>
          }
        />
        <Route
          path="/payments"
          element={
            <PageWrapper title="Payment History">
              <ViewPayment />
            </PageWrapper>
          }
        />
        <Route
          path="/products"
          element={
            <PageWrapper title="Product Management">
              <ProductManagement />
            </PageWrapper>
          }
        />
      </Routes>
    </div>
  );
};

export default StaffDashboard;
