import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min.js";
import Chart from "chart.js/auto";
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
  const [historicalData, setHistoricalData] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [historicalLoading, setHistoricalLoading] = useState(false);

  // Create refs for chart and PDF content
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Initialize with current month/year when component mounts
  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear().toString());
    setMonth((now.getMonth() + 1).toString().padStart(2, "0"));
  }, []);

  // Handle chart creation/update when report data or historical data changes
  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    let chartData;
    let chartType = "line";

    try {
      if (compareMode && historicalData.length > 0) {
        // For comparison mode - show all months in historical data
        chartData = {
          labels: historicalData.map((item) => {
            const date = new Date(item.year, item.month - 1);
            return date.toLocaleDateString("default", {
              month: "short",
              year: "numeric",
            });
          }),
          datasets: [
            {
              label: "Monthly Revenue (₱)",
              data: historicalData.map((item) => item.totalRevenue),
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
              tension: 0.3,
            },
          ],
        };
      } else if (
        reportData?.monthlySales &&
        reportData.monthlySales.length > 0
      ) {
        // For single month report - use monthly sales data (daily sales within the month)
        chartData = {
          labels: reportData.monthlySales.map((item) => item.month),
          datasets: [
            {
              label: "Daily Revenue (₱)",
              data: reportData.monthlySales.map((item) => item.revenue),
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
              tension: 0.3,
            },
          ],
        };
      } else if (reportData) {
        // If no daily data available, create a simple chart with the month's total
        const monthName = new Date(
          reportData.period.year,
          reportData.period.month - 1
        ).toLocaleString("default", { month: "long" });
        chartData = {
          labels: [monthName],
          datasets: [
            {
              label: "Monthly Revenue (₱)",
              data: [reportData.statistics.totalRevenue],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        };
        chartType = "bar";
      } else {
        // If no valid chart data available
        return;
      }

      const ctx = chartRef.current.getContext("2d");
      chartInstance.current = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) {
                    label += ": ";
                  }
                  if (context.parsed.y !== null) {
                    label += "₱" + context.parsed.y.toLocaleString();
                  }
                  return label;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `₱${value.toLocaleString()}`,
              },
            },
          },
        },
      });
    } catch (err) {
      console.error("Error creating chart:", err);
      setError("Failed to create chart visualization");
    }
  }, [reportData, historicalData, compareMode]);

  // Fetch historical data for the selected year
  const fetchHistoricalData = async (year) => {
    try {
      setHistoricalLoading(true);
      setError(null);

      console.log(`Fetching historical data for year: ${year}`);
      const response = await api.get(`/reports/yearly/${year}`);

      if (response.data && response.data.monthlyData) {
        // Sort data chronologically by month
        const sortedData = response.data.monthlyData.sort(
          (a, b) => a.month - b.month
        );
        setHistoricalData(sortedData);
        setHistoricalLoading(false);
        return sortedData;
      } else {
        setError("No historical data available");
        setHistoricalLoading(false);
        return [];
      }
    } catch (err) {
      console.error("Error fetching historical data:", err);
      setError(
        `Failed to fetch historical data: ${
          err.response?.data?.message || err.message
        }`
      );
      setHistoricalLoading(false);
      return [];
    }
  };

  // Handle switching between single month and comparison view
  const toggleCompareMode = async () => {
    if (!compareMode && historicalData.length === 0) {
      // Fetch historical data if not already loaded
      await fetchHistoricalData(year);
    }
    setCompareMode(!compareMode);
  };

  const handleGenerateReport = async ({ month, year }) => {
    try {
      setLoading(true);
      setError(null);
      setReportData(null);

      if (!month || isNaN(parseInt(month))) {
        setError("Invalid month. Please provide a valid month (1-12).");
        setLoading(false);
        return;
      }

      const monthNum = parseInt(month);
      if (monthNum < 1 || monthNum > 12) {
        setError("Month must be between 1 and 12");
        setLoading(false);
        return;
      }

      const formattedMonth = monthNum.toString().padStart(2, "0");

      // Get monthly report data
      console.log(`Generating report for ${year}-${formattedMonth}`);
      const response = await api.get(
        `/reports/monthly/${year}/${formattedMonth}`
      );

      if (response.data) {
        const reportData = response.data;
        console.log("Report data received:", reportData);

        // Calculate daily sales for charting if not provided
        let monthlySales = [];

        if (reportData.metrics && reportData.metrics.monthly_sales) {
          monthlySales = reportData.metrics.monthly_sales;
        } else {
          // If no daily breakdown, create a simple month view
          monthlySales = [
            {
              month: reportData.month,
              revenue: reportData.metrics.total_revenue || 0,
            },
          ];
        }

        setReportData({
          period: {
            month: monthNum,
            year: parseInt(year),
          },
          statistics: {
            totalReservations: reportData.metrics.total_reservations || 0,
            acceptedReservations: reportData.metrics.accepted_reservations || 0,
            cancelledReservations:
              reportData.metrics.canceled_reservations || 0,
            declinedReservations: reportData.metrics.declined_reservations || 0,
            totalRevenue: reportData.metrics.total_revenue || 0,
          },
          monthlySales: monthlySales,
          acceptedReservations: reportData.acceptedReservations || [],
          declinedReservations: reportData.declinedReservations || [],
        });
      }

      // Also fetch historical data for comparison
      await fetchHistoricalData(year);
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

  const generatePDF = async () => {
    if (!reportData) return;

    try {
      setPdfLoading(true);

      // Create a copy of the chart for PDF
      const chartCanvas = chartRef.current;
      if (!chartCanvas) {
        setError("Chart not available for PDF generation");
        setPdfLoading(false);
        return;
      }

      const chartImage = chartCanvas.toDataURL("image/png");

      // Create PDF content element
      const pdfContent = document.createElement("div");
      pdfContent.className = "pdf-container";

      const monthName = new Date(
        reportData.period.year,
        reportData.period.month - 1
      ).toLocaleString("default", { month: "long" });

      // Get historical context for the report
      let historicalContext = "";
      if (historicalData.length > 0) {
        // Find the highest revenue month
        const highestRevenue = [...historicalData].sort(
          (a, b) => b.totalRevenue - a.totalRevenue
        )[0];

        if (highestRevenue) {
          const highestMonth = new Date(
            highestRevenue.year,
            highestRevenue.month - 1
          ).toLocaleString("default", { month: "long" });

          // Find previous month data if available
          const prevMonthIndex = historicalData.findIndex(
            (item) =>
              item.month === reportData.period.month - 1 ||
              (reportData.period.month === 1 && item.month === 12)
          );

          if (prevMonthIndex !== -1) {
            const prevMonth = historicalData[prevMonthIndex];
            const prevMonthName = new Date(
              prevMonth.year,
              prevMonth.month - 1
            ).toLocaleString("default", { month: "long" });

            const change =
              reportData.statistics.totalRevenue - prevMonth.totalRevenue;
            const changePercent =
              prevMonth.totalRevenue > 0
                ? ((change / prevMonth.totalRevenue) * 100).toFixed(2)
                : 0;

            historicalContext = `
              <div class="pdf-historical">
                <h3>Monthly Comparison</h3>
                <p>Compared to ${prevMonthName}, revenue has ${
              change >= 0 ? "increased" : "decreased"
            } by 
                  ₱${Math.abs(change).toLocaleString()} (${
              change >= 0 ? "+" : ""
            }${changePercent}%).</p>
                <p>The highest revenue this year was in ${highestMonth} (₱${highestRevenue.totalRevenue.toLocaleString()}).</p>
              </div>
            `;
          }
        }
      }

      pdfContent.innerHTML = `
        <div class="pdf-header">
          <h1>Monthly Reservation Report</h1>
          <h2>${monthName} ${reportData.period.year}</h2>
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
        
        ${historicalContext}

        <div class="pdf-chart">
          <h3>${
            compareMode
              ? "Monthly Revenue Comparison"
              : "Monthly Sales Overview"
          }</h3>
          <img src="${chartImage}" style="max-width: 100%; height: auto;" />
        </div>

        <div class="pdf-reservations">
          <h3>Accepted Reservations</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Date</th><th>Time</th><th>Pax</th><th>Amount</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                reportData.acceptedReservations &&
                reportData.acceptedReservations.length > 0
                  ? reportData.acceptedReservations
                      .map(
                        (r) => `
                  <tr>
                    <td>${r.reservation_id}</td>
                    <td>${r.name}</td>
                    <td>${new Date(
                      r.reservation_date
                    ).toLocaleDateString()}</td>
                    <td>${r.timeSlot}</td>
                    <td>${r.numberOfPax}</td>
                    <td>₱${(r.total_amount || 0).toLocaleString()}</td>
                    <td>${r.reservation_status}</td>
                  </tr>`
                      )
                      .join("")
                  : `<tr><td colspan="7" style="text-align: center;">No accepted reservations for this period</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div class="pdf-reservations">
          <h3>Declined Reservations</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Date</th><th>Time</th><th>Pax</th><th>Amount</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                reportData.declinedReservations &&
                reportData.declinedReservations.length > 0
                  ? reportData.declinedReservations
                      .map(
                        (r) => `
                  <tr>
                    <td>${r.reservation_id}</td>
                    <td>${r.name}</td>
                    <td>${new Date(
                      r.reservation_date
                    ).toLocaleDateString()}</td>
                    <td>${r.timeSlot}</td>
                    <td>${r.numberOfPax}</td>
                    <td>₱${(r.total_amount || 0).toLocaleString()}</td>
                    <td>${r.reservation_status}</td>
                  </tr>`
                      )
                      .join("")
                  : `<tr><td colspan="7" style="text-align: center;">No declined reservations for this period</td></tr>`
              }
            </tbody>
          </table>
        </div>
      `;

      // Add PDF content to document temporarily
      document.body.appendChild(pdfContent);

      setTimeout(() => {
        try {
          const options = {
            margin: 10,
            filename: `Monthly_Report_${reportData.period.month}_${reportData.period.year}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          };

          html2pdf()
            .set(options)
            .from(pdfContent)
            .save()
            .then(() => {
              // Clean up
              document.body.removeChild(pdfContent);
              setPdfLoading(false);
            })
            .catch((err) => {
              console.error("PDF generation error:", err);
              document.body.removeChild(pdfContent);
              setPdfLoading(false);
              setError("Failed to generate PDF. Please try again.");
            });
        } catch (error) {
          console.error("PDF error:", error);
          document.body.removeChild(pdfContent);
          setPdfLoading(false);
          setError("Error generating PDF");
        }
      }, 500);
    } catch (error) {
      console.error("PDF preparation error:", error);
      setPdfLoading(false);
      setError("Error preparing PDF content");
    }
  };

  // Find the month with highest revenue
  const getHighestRevenueMonth = () => {
    if (historicalData.length === 0) return null;
    return [...historicalData].sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    )[0];
  };

  // Format month name
  const getMonthName = (monthNum) => {
    return new Date(0, monthNum - 1).toLocaleString("default", {
      month: "long",
    });
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
          <div className="actions-row">
            <button
              onClick={generatePDF}
              className="generate-button pdf-button"
              disabled={pdfLoading}
              style={{ marginRight: "10px" }}
            >
              {pdfLoading ? "Generating PDF..." : "Export to PDF"}
            </button>

            <button
              onClick={toggleCompareMode}
              className="generate-button"
              disabled={historicalLoading}
              style={{ backgroundColor: compareMode ? "#6c757d" : "#28a745" }}
            >
              {historicalLoading
                ? "Loading Data..."
                : compareMode
                ? "Show Daily View"
                : "Compare Months"}
            </button>
          </div>

          <div className="stats-grid">
            <div className="status-card">
              <h4>Total Reservations</h4>
              <p className="status-number">
                {reportData.statistics.totalReservations}
              </p>
            </div>
            <div className="status-card">
              <h4>Total Revenue</h4>
              <p className="status-number">
                ₱{reportData.statistics.totalRevenue.toLocaleString()}
              </p>
            </div>

            {historicalData.length > 0 && (
              <>
                <div className="status-card">
                  <h4>Previous Month</h4>
                  {(() => {
                    const prevMonthNum =
                      reportData.period.month === 1
                        ? 12
                        : reportData.period.month - 1;
                    const prevMonth = historicalData.find(
                      (m) => m.month === prevMonthNum
                    );
                    if (prevMonth) {
                      const change =
                        reportData.statistics.totalRevenue -
                        prevMonth.totalRevenue;
                      const changePercent =
                        prevMonth.totalRevenue > 0
                          ? ((change / prevMonth.totalRevenue) * 100).toFixed(2)
                          : 0;
                      return (
                        <>
                          <p className="status-number">
                            ₱{prevMonth.totalRevenue.toLocaleString()}
                          </p>
                          <p
                            style={{
                              color: change >= 0 ? "#28a745" : "#dc3545",
                              fontWeight: "bold",
                            }}
                          >
                            {change >= 0 ? "▲" : "▼"} {Math.abs(changePercent)}%
                          </p>
                        </>
                      );
                    }
                    return <p className="status-number">No data</p>;
                  })()}
                </div>
                <div className="status-card">
                  <h4>Best Month</h4>
                  {(() => {
                    const highestMonth = getHighestRevenueMonth();
                    if (highestMonth) {
                      return (
                        <>
                          <p className="status-number">
                            ₱{highestMonth.totalRevenue.toLocaleString()}
                          </p>
                          <p>{getMonthName(highestMonth.month)}</p>
                        </>
                      );
                    }
                    return <p className="status-number">No data</p>;
                  })()}
                </div>
              </>
            )}
          </div>

          {/* Chart container */}
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              margin: "0 auto",
              marginBottom: "30px",
            }}
          >
            <h3 style={{ textAlign: "center", marginBottom: "15px" }}>
              {compareMode ? "Monthly Revenue Comparison" : "Revenue Overview"}
            </h3>
            <div style={{ height: "400px", width: "100%" }}>
              <canvas ref={chartRef} width="800" height="400"></canvas>
            </div>
          </div>

          {/* Accepted Reservations Table */}
          <div className="accepted-reservations">
            <h4>Accepted Reservations</h4>
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
                  {reportData.acceptedReservations.length > 0 ? (
                    reportData.acceptedReservations.map(
                      (reservation, index) => (
                        <tr key={`accept-${index}`}>
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
                      )
                    )
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center" }}>
                        No accepted reservations for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Declined Reservations Table */}
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
                  {reportData.declinedReservations.length > 0 ? (
                    reportData.declinedReservations.map(
                      (reservation, index) => (
                        <tr key={`decline-${index}`}>
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
                      )
                    )
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center" }}>
                        No declined reservations for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
