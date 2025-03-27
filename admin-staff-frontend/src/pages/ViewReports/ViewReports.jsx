import React, { useState } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min.js";
import "./ViewReports.css";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AdminReports = () => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleGenerateReport = async ({ month, year }) => {
    try {
      setLoading(true);
      setError(null);
      setReportData(null);

      // Convert month to two-digit format
      const formattedMonth = month.padStart(2, "0");

      // Fetch all reservations for the specific month and year
      const [monthlyReportResponse, allReservationsResponse] =
        await Promise.all([
          api.get(`/reports/monthly/${year}/${month}`),
          api.get(`/reservations?year=${year}&month=${formattedMonth}`),
        ]);

      if (monthlyReportResponse.data && allReservationsResponse.data) {
        const allReservations = allReservationsResponse.data;

        // Calculate status distribution
        const statusDistribution = allReservations.reduce(
          (acc, reservation) => {
            const status = reservation.reservation_status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          },
          {}
        );

        // Filter reservations by status
        const acceptedReservations = allReservations.filter(
          (r) => r.reservation_status === "accepted"
        );
        const cancelledReservations = allReservations.filter(
          (r) => r.reservation_status === "cancelled"
        );
        const declinedReservations = allReservations.filter(
          (r) => r.reservation_status === "declined"
        );

        // Fetch active accepted reservations
        const activeAcceptedReservationsResponse = await api.get(
          "/reservations/accepted"
        );
        const activeAcceptedReservations =
          activeAcceptedReservationsResponse.data;

        // Calculate total revenue from accepted reservations
        const totalRevenue = acceptedReservations.reduce(
          (total, reservation) => total + reservation.total_amount,
          0
        );

        setReportData({
          ...monthlyReportResponse.data,
          statistics: {
            totalReservations: allReservations.length,
            acceptedReservations: acceptedReservations.length,
            cancelledReservations: cancelledReservations.length,
            declinedReservations: declinedReservations.length,
            statusDistribution,
            totalRevenue,
          },
          allReservations,
          acceptedReservations: activeAcceptedReservations,
          declinedReservations: declinedReservations,
        });
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

  const generatePDF = () => {
    if (!reportData) return;

    setPdfLoading(true);

    const createPDFContent = () => {
      const reportContainer = document.createElement("div");
      reportContainer.classList.add("pdf-container");
      reportContainer.innerHTML = `
        <div class="pdf-header">
          <h1>Monthly Reservation Report</h1>
          <h2>${new Date(
            reportData.period.year,
            reportData.period.month - 1
          ).toLocaleString("default", { month: "long" })} ${
        reportData.period.year
      }</h2>
        </div>
        
        <div class="pdf-summary">
          <h3>Report Summary</h3>
          <p>Total Reservations: ${reportData.statistics.totalReservations}</p>
          <p>Accepted Reservations: ${
            reportData.statistics.acceptedReservations
          }</p>
          <p>Cancelled Reservations: ${
            reportData.statistics.cancelledReservations
          }</p>
          <p>Declined Reservations: ${
            reportData.statistics.declinedReservations
          }</p>
          <p>Total Revenue: ₱${reportData.statistics.totalRevenue.toLocaleString()}</p>
        </div>
        
        <div class="pdf-reservations">
          <h3>Accepted Reservations</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Pax</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.acceptedReservations
                .map(
                  (reservation) => `
                  <tr>
                    <td>${reservation.reservation_id}</td>
                    <td>${reservation.name}</td>
                    <td>${new Date(
                      reservation.reservation_date
                    ).toLocaleDateString()}</td>
                    <td>${reservation.timeSlot}</td>
                    <td>${reservation.numberOfPax}</td>
                    <td>₱${reservation.total_amount.toLocaleString()}</td>
                    <td>${reservation.reservation_status}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        
        <div class="pdf-declined-reservations">
          <h3>Declined Reservations</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Pax</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.declinedReservations
                .map(
                  (reservation) => `
                  <tr>
                    <td>${reservation.reservation_id}</td>
                    <td>${reservation.name}</td>
                    <td>${new Date(
                      reservation.reservation_date
                    ).toLocaleDateString()}</td>
                    <td>${reservation.timeSlot}</td>
                    <td>${reservation.numberOfPax}</td>
                    <td>₱${reservation.total_amount.toLocaleString()}</td>
                    <td>${reservation.reservation_status}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      return reportContainer;
    };

    // Add PDF generation logic here using html2pdf
    const pdfContent = createPDFContent();
    html2pdf().from(pdfContent).save();
    setPdfLoading(false);
  };

  return (
    <div className="report-container">
      <h2>Monthly Reservation Report</h2>

      {error && <div className="error-message">{error}</div>}

      <form
        className="report-form"
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

          <div className="actions-row">
            <button
              onClick={generatePDF}
              className="generate-button pdf-button"
              disabled={pdfLoading}
            >
              {pdfLoading ? "Generating PDF..." : "Export to PDF"}
            </button>
          </div>

          <div className="stats-grid">
            <div className="status-card">
              <h4>Total Reservations</h4>
              <p className="status-number">
                {reportData.statistics.totalReservations}
              </p>
              <p className="status-label">
                Accepted: {reportData.statistics.acceptedReservations} |
                Cancelled: {reportData.statistics.cancelledReservations} |
                Declined: {reportData.statistics.declinedReservations}
              </p>
            </div>

            <div className="status-card">
              <h4>Total Revenue</h4>
              <p className="status-number">
                ₱{reportData.statistics.totalRevenue.toLocaleString()}
              </p>
              <p className="status-label">
                From {reportData.statistics.acceptedReservations} accepted
                reservations
              </p>
            </div>
          </div>

          {reportData.acceptedReservations &&
            reportData.acceptedReservations.length > 0 && (
              <div className="accepted-reservations">
                <h4>Active Accepted Reservations</h4>
                <div className="table-responsive">
                  <table className="reservations-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Pax</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.acceptedReservations.map((reservation) => (
                        <tr key={reservation.reservation_id}>
                          <td>{reservation.reservation_id}</td>
                          <td>{reservation.name}</td>
                          <td>
                            {new Date(
                              reservation.reservation_date
                            ).toLocaleDateString()}
                          </td>
                          <td>{reservation.timeSlot}</td>
                          <td>{reservation.numberOfPax}</td>
                          <td>₱{reservation.total_amount.toLocaleString()}</td>
                          <td>{reservation.reservation_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {reportData.declinedReservations &&
            reportData.declinedReservations.length > 0 && (
              <div className="declined-reservations">
                <h4>Declined Reservations</h4>
                <div className="table-responsive">
                  <table className="reservations-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Pax</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.declinedReservations.map((reservation) => (
                        <tr key={reservation.reservation_id}>
                          <td>{reservation.reservation_id}</td>
                          <td>{reservation.name}</td>
                          <td>
                            {new Date(
                              reservation.reservation_date
                            ).toLocaleDateString()}
                          </td>
                          <td>{reservation.timeSlot}</td>
                          <td>{reservation.numberOfPax}</td>
                          <td>₱{reservation.total_amount.toLocaleString()}</td>
                          <td>{reservation.reservation_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
