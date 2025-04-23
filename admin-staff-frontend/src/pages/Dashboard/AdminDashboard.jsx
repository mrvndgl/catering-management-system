import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../../components/Sidebar/AdminSidebar/AdminSidebar";
import ProductManagement from "../ProductManagement/ProductManagement";
import AdminReservations from "../ViewReservations/AdminReservations";
import FeedbackManagement from "../FeedbackManagement/FeedbackManagement";
import ViewPayment from "../ViewPayment/ViewPayment";
import AdminReports from "../ViewReports/ViewReports";
import ViewAccounts from "../ViewAccounts/ViewAccounts";
import ViewSchedules from "../ViewSchedules.jsx/ViewSchedules";
import {
  ClipboardList,
  CreditCard,
  Utensils,
  TrendingUp,
  Check,
  Users,
  Calendar,
} from "lucide-react";
import "./AdminDashboard.css";
import { useSidebar } from "../../context/SidebarContext";
import axios from "axios";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";

// Register all ChartJS components
ChartJS.register(...registerables);

const DashboardContent = ({ isSidebarCollapsed }) => {
  const [acceptedReservations, setAcceptedReservations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [overallStats, setOverallStats] = useState({
    totalReservations: 0,
    totalRevenue: 0,
    avgRevenuePerReservation: 0,
    totalGuests: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
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

        // Calculate revenue from accepted reservations
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

        // Fetch overall statistics
        const overallStatsResponse = await axios.get(
          "/api/reports/overall-stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setOverallStats(overallStatsResponse.data.overallStats);

        // Get current year and month
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // Fetch monthly report data for current month
        const monthlyReportResponse = await axios.get(
          `/api/reports/monthly/${currentYear}/${currentMonth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMonthlyData(monthlyReportResponse.data.metrics.monthly_sales || []);

        // Fetch yearly report data
        const yearlyReportResponse = await axios.get(
          `/api/reports/yearly/${currentYear}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setYearlyData(yearlyReportResponse.data.monthlyData || []);
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

  // Prepare chart data for monthly revenue
  const monthlyChartData = {
    labels: monthlyData.map((item) => `Day ${item.day}`),
    datasets: [
      {
        label: "Daily Revenue",
        data: monthlyData.map((item) => item.revenue),
        fill: true,
        backgroundColor: "rgba(38, 50, 56, 0.2)",
        borderColor: "#263238",
        tension: 0.4,
      },
    ],
  };

  // Prepare chart data for yearly revenue
  const yearlyChartData = {
    labels: yearlyData.map((item) => item.monthName),
    datasets: [
      {
        label: "Monthly Revenue",
        data: yearlyData.map((item) => item.totalRevenue),
        backgroundColor: [
          "#263238",
          "#455A64",
          "#607D8B",
          "#78909C",
          "#90A4AE",
          "#B0BEC5",
          "#CFD8DC",
          "#ECEFF1",
          "#607D8B",
          "#455A64",
          "#263238",
          "#32465F",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for reservation status
  const reservationStatusData = {
    labels: ["Accepted", "Declined", "Cancelled"],
    datasets: [
      {
        data: [
          yearlyData.reduce(
            (sum, month) => sum + month.acceptedReservations,
            0
          ),
          yearlyData.reduce(
            (sum, month) => sum + month.declinedReservations,
            0
          ),
          yearlyData.reduce(
            (sum, month) => sum + month.cancelledReservations,
            0
          ),
        ],
        backgroundColor: ["#4CAF50", "#F44336", "#FF9800"],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className={`main-content ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="main-header">
        <h1 className="page-title">Dashboard Overview</h1>
      </div>
      <div className="content-area">
        {/* Top Stats Cards */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="stat-card">
              <div className="stat-icon">
                <Check size={40} color="#ffffff" />
              </div>
              <div className="stat-content">
                <h3>Accepted Reservations</h3>
                <p className="stat-number">
                  {isLoading
                    ? "Loading..."
                    : overallStats.accepted_reservations ||
                      acceptedReservations}
                </p>
                <p className="stat-label">All Time</p>
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={40} color="#ffffff" />
              </div>
              <div className="stat-content">
                <h3>Avg. Revenue</h3>
                <p className="stat-number">
                  {isLoading
                    ? "Loading..."
                    : `₱${overallStats.avgRevenuePerReservation.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`}
                </p>
                <p className="stat-label">Per Reservation</p>
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={40} color="#ffffff" />
              </div>
              <div className="stat-content">
                <h3>Total Guests</h3>
                <p className="stat-number">
                  {isLoading ? "Loading..." : overallStats.totalGuests || 0}
                </p>
                <p className="stat-label">All Time</p>
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="stat-card">
              <div className="stat-icon">
                <CreditCard size={40} color="#ffffff" />
              </div>
              <div className="stat-content">
                <h3>Total Revenue</h3>
                <p className="stat-number">
                  {isLoading
                    ? "Loading..."
                    : `₱${overallStats.totalRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </p>
                <p className="stat-label">All Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-container">
          {/* Daily Revenue Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Daily Revenue (Current Month)</h3>
            <div className="chart-container">
              {isLoading ? (
                <div className="loading-indicator">Loading chart data...</div>
              ) : monthlyData.length > 0 ? (
                <Line
                  data={monthlyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: "top",
                      },
                      tooltip: {
                        mode: "index",
                        intersect: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Revenue (₱)",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Day",
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="no-data-message">
                  No data available for the current month
                </div>
              )}
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Monthly Revenue (Current Year)</h3>
            <div className="chart-container">
              {isLoading ? (
                <div className="loading-indicator">Loading chart data...</div>
              ) : yearlyData.length > 0 ? (
                <Bar
                  data={yearlyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            return `₱${context.raw.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Revenue (₱)",
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="no-data-message">
                  No data available for the current year
                </div>
              )}
            </div>
          </div>

          {/* Reservation Status Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Reservation Status Distribution</h3>
            <div className="chart-container doughnut-container">
              {isLoading ? (
                <div className="loading-indicator">Loading chart data...</div>
              ) : yearlyData.length > 0 ? (
                <Doughnut
                  data={reservationStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                      },
                    },
                  }}
                />
              ) : (
                <div className="no-data-message">No data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rest of the code remains the same
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

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const { isSidebarCollapsed } = useSidebar();

  return (
    <div className="dashboard-container">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />
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
          path="/products"
          element={
            <PageWrapper title="Product Management">
              <ProductManagement />
            </PageWrapper>
          }
        />
        <Route
          path="/reservations"
          element={
            <PageWrapper title="Reservations">
              <AdminReservations />
            </PageWrapper>
          }
        />
        <Route
          path="/schedules"
          element={
            <PageWrapper title="Schedules">
              <ViewSchedules />
            </PageWrapper>
          }
        />
        <Route
          path="/feedback"
          element={
            <PageWrapper title="Customer Feedback">
              <FeedbackManagement />
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
          path="/reports"
          element={
            <PageWrapper title="Reports & Analytics">
              <AdminReports />
            </PageWrapper>
          }
        />
        <Route
          path="/accounts"
          element={
            <PageWrapper title="Manage Accounts">
              <ViewAccounts />
            </PageWrapper>
          }
        />
      </Routes>
    </div>
  );
};

export default AdminDashboard;
