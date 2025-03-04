import React, { useState, useEffect } from "react";
import "./Schedules.css";

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchPublicSchedules();
  }, [currentPage]);

  const fetchPublicSchedules = async () => {
    try {
      setIsLoading(true);
      setError(null); // Reset error state before fetching

      const response = await fetch(
        `/api/schedules?page=${currentPage}&limit=10`
      );

      if (!response.ok) {
        // Attempt to parse error response
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch schedules");
      }

      const data = await response.json();
      setSchedules(data.schedules || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      // Ensure error is a string
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Error rendering function
  const renderError = () => {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchPublicSchedules}>Try Again</button>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading schedules...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return renderError();
  }

  // Render schedule cards
  const renderScheduleCard = (schedule) => (
    <div key={schedule._id || schedule.schedule_id} className="schedule-card">
      <div className="schedule-header">
        <h3>{schedule.eventType || "Unnamed Event"}</h3>
        <span className="date">
          {schedule.formattedReservationDate || "Date Not Specified"}
        </span>
      </div>
      <div className="schedule-details">
        <p>
          <strong>Customer:</strong>
          {schedule.customerName || "Unknown Customer"}
        </p>
        <p>
          <strong>Guests:</strong>
          {schedule.numberOfGuests || "N/A"}
        </p>
        {schedule.specialRequirements && (
          <p>
            <strong>Special Requirements:</strong>
            {schedule.specialRequirements}
          </p>
        )}
        <div className="schedule-status">
          <span
            className={`status-badge ${(
              schedule.status || "pending"
            ).toLowerCase()}`}
          >
            {schedule.status || "Pending"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="schedules-container">
      <h2>Upcoming Schedules</h2>
      {schedules.length === 0 ? (
        <div className="no-schedules">
          <p>No schedules found. Check back later!</p>
        </div>
      ) : (
        <>
          <div className="schedules-grid">
            {schedules.map(renderScheduleCard)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={page === currentPage ? "active" : ""}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Schedules;
