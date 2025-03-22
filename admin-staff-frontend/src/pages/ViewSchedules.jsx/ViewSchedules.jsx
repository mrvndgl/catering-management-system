import React, { useState, useEffect } from "react";
import "./ViewSchedules.css";

const ViewSchedules = () => {
  const [bookedDates, setBookedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("ViewSchedules component mounted");
    fetchBookedDates();
  }, []);

  const fetchBookedDates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching booked dates for admin view...");

      const response = await fetch("/api/schedules/booked-dates");
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Full API Response:", data);

      if (!data || !Array.isArray(data.bookedDates)) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid data format: bookedDates is not an array");
      }

      setBookedDates(data.bookedDates);
      console.log("Booked dates set:", data.bookedDates);
    } catch (err) {
      console.error("Error details:", err);
      setError(err.message || "Failed to load booked dates");
    } finally {
      setIsLoading(false);
    }
  };

  const renderDateCard = (dateObj) => {
    // Format the date for display if formattedDate isn't provided
    const dateDisplay =
      dateObj.formattedDate ||
      new Date(dateObj.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });

    return (
      <div key={dateObj.date} className="admin-date-card">
        <div className="admin-date-info">
          <span className="admin-date">{dateDisplay}</span>
          <span className="admin-status-badge booked">Reserved</span>
        </div>
        {dateObj.timeSlot && (
          <div className="admin-time-slot">
            <span>Time: {dateObj.timeSlot}</span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="admin-loading-container">
        <p>Loading reserved dates...</p>
      </div>
    );

  if (error)
    return (
      <div className="admin-error-container">
        <p>Error: {error}</p>
        <button className="admin-retry-btn" onClick={fetchBookedDates}>
          Retry
        </button>
      </div>
    );

  return (
    <div className="admin-schedules-container">
      <h2 className="admin-title">Reserved Dates</h2>

      {bookedDates.length === 0 ? (
        <div className="admin-no-schedules">
          <p>No reserved dates available.</p>
        </div>
      ) : (
        <>
          <div className="admin-summary">
            <p>
              Total Reservations:{" "}
              <span className="admin-count">{bookedDates.length}</span>
            </p>
          </div>
          <div className="admin-dates-container">
            <div className="admin-dates-grid">
              {bookedDates.map(renderDateCard)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ViewSchedules;
