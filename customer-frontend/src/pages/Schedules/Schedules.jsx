import React, { useState, useEffect } from "react";
import "./Schedules.css";

const Schedules = () => {
  const [bookedDates, setBookedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    console.log("Schedules component mounted");
    fetchBookedDates();
  }, []);

  const fetchBookedDates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching booked dates...");

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
      setDebugInfo(data);
      console.log("Booked dates set:", data.bookedDates);
    } catch (err) {
      console.error("Error details:", err);
      setError(err.message || "Failed to load booked dates");
      setDebugInfo({ error: err.message, stack: err.stack });
    } finally {
      setIsLoading(false);
    }
  };

  const renderDateCard = (dateObj) => {
    console.log("Rendering date card for:", dateObj);
    return (
      <div key={dateObj.date} className="date-card">
        <div className="date-info">
          <span className="date">{dateObj.formattedDate}</span>
          <span className="status-badge booked">Booked</span>
        </div>
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="error-container">
        <p>{error}</p>
        {debugInfo && (
          <details>
            <summary>Debug Info</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        )}
      </div>
    );

  return (
    <div className="schedules-container">
      <h2 className="unavailable-dates-title">Unavailable Dates</h2>
      {bookedDates.length === 0 ? (
        <div className="no-schedules">
          <p>All dates are currently available!</p>
          {debugInfo && (
            <details>
              <summary>Debug Info</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
        </div>
      ) : (
        <div className="dates-container">
          <div className="dates-grid">{bookedDates.map(renderDateCard)}</div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
