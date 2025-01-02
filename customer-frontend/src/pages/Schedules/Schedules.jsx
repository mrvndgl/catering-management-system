import React, { useState, useEffect } from "react";
import "./Schedules.css";

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAcceptedReservations();
  }, []);

  const fetchAcceptedReservations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/reservations/accepted", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeSlot) => {
    return timeSlot
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) return <div className="loading">Loading schedules...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="schedules-container">
      <h2>Upcoming Events Schedule</h2>
      {schedules.length === 0 ? (
        <p>No scheduled events at the moment.</p>
      ) : (
        <div className="schedules-grid">
          {schedules.map((schedule) => (
            <div key={schedule.reservation_id} className="schedule-card">
              <div className="schedule-header">
                <h3>Event Details</h3>
                <span className="date">
                  {formatDate(schedule.reservation_date)}
                </span>
              </div>
              <div className="schedule-details">
                <p>
                  <strong>Customer:</strong> {schedule.name}
                </p>
                <p>
                  <strong>Time:</strong> {formatTime(schedule.timeSlot)}
                </p>
                <p>
                  <strong>Venue:</strong> {schedule.venue}
                </p>
                <p>
                  <strong>Number of Guests:</strong> {schedule.numberOfPax}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedules;
