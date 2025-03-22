import React, { useState } from "react";
import axios from "axios";
import "./ViewReports.css";

// Create axios instance with default config
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AdminReports = () => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const handleGenerateReport = async ({ month, year }) => {
    try {
      setLoading(true);
      setError(null);
      setReportData(null);

      const response = await api.get(`/reports/monthly/${year}/${month}`);

      if (response.data) {
        setReportData(response.data);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to generate report";
      setError(errorMessage);
      console.error("Report generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-form">
      <h2>Monthly Reservation Report</h2>
      {error && <div className="error-message">{error}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerateReport({ month, year });
        }}
      >
        <div className="form-group">
          <label htmlFor="month">Select Month:</label>
          <input
            type="month"
            id="month"
            value={`${year}-${month.padStart(2, "0")}`}
            onChange={(e) => {
              const [selectedYear, selectedMonth] = e.target.value.split("-");
              setYear(selectedYear);
              setMonth(selectedMonth);
            }}
            required
          />
        </div>
        <button type="submit" className="generate-button" disabled={loading}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </form>

      {reportData && (
        <div className="report-data">
          <h3>
            Report for{" "}
            {new Date(
              reportData.period.year,
              reportData.period.month - 1
            ).toLocaleString("default", { month: "long" })}{" "}
            {reportData.period.year}
          </h3>

          <div className="stats-grid">
            <div className="stat-cards">
              <h4>Total Reservations</h4>
              <p className="stat-number">
                {reportData.statistics.totalReservations}
              </p>
              <p className="stat-label">
                ({reportData.statistics.acceptedReservations} accepted)
              </p>
            </div>

            <div className="stat-cards">
              <h4>Total Revenue</h4>
              <p className="stat-number">
                ₱{reportData.statistics.totalRevenue.toLocaleString()}
              </p>
              <p className="stat-label">From accepted reservations</p>
            </div>

            <div className="stat-cards">
              <h4>Status Distribution</h4>
              <div className="status-list">
                {Object.entries(reportData.statistics.statusDistribution).map(
                  ([status, count]) => (
                    <div key={status} className="status-item">
                      <span className="status-label">{status}</span>
                      <span className="status-count">{count}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
