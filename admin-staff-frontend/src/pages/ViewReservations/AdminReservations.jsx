import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminReservations.css";

const AdminReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      console.log("Starting reservation fetch");

      const response = await fetch("/api/reservations", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Reservations fetched successfully:", data);
      setReservations(data);
    } catch (error) {
      console.error("Fetch failed:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReservationAction = async (reservationId, status) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reservation_status: status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update reservation status to ${status}`);
      }

      // Update local state to reflect the change
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.reservation_id === reservationId
            ? { ...reservation, reservation_status: status }
            : reservation
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const viewReservationDetails = (reservation) => {
    setSelectedReservation(reservation);
  };

  const closeReservationDetails = () => {
    setSelectedReservation(null);
  };

  const goBackToDashboard = () => {
    navigate("/admin/dashboard");
  };

  if (isLoading) {
    return (
      <div className="admin-reservations-container">
        <button className="back-button" onClick={goBackToDashboard}>
          Back to Dashboard
        </button>
        <div className="loading">Loading reservations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-reservations-container">
        <button className="back-button" onClick={goBackToDashboard}>
          Back to Dashboard
        </button>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-reservations-container">
      <div className="reservations-header">
        <button className="back-button" onClick={goBackToDashboard}>
          Back to Dashboard
        </button>
        <h1>Manage Reservations</h1>
      </div>

      {reservations.length === 0 ? (
        <div className="no-reservations">No reservations found</div>
      ) : (
        <table className="reservations-table">
          <thead>
            <tr>
              <th>Reservation ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Time Slot</th>
              <th>Pax</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.reservation_id}>
                <td>{reservation.reservation_id}</td>
                <td>{reservation.name}</td>
                <td>{formatDate(reservation.reservation_date)}</td>
                <td>{reservation.timeSlot}</td>
                <td>{reservation.numberOfPax}</td>
                <td>₱{reservation.total_amount.toLocaleString()}</td>
                <td>
                  <span
                    className={`status-badge ${reservation.reservation_status.toLowerCase()}`}
                  >
                    {reservation.reservation_status}
                  </span>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="view-btn"
                      onClick={() => viewReservationDetails(reservation)}
                    >
                      View
                    </button>
                    {reservation.reservation_status === "Pending" && (
                      <>
                        <button
                          className="accept-btn"
                          onClick={() =>
                            handleReservationAction(
                              reservation.reservation_id,
                              "Accepted"
                            )
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="decline-btn"
                          onClick={() =>
                            handleReservationAction(
                              reservation.reservation_id,
                              "Declined"
                            )
                          }
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedReservation && (
        <div className="reservation-details-modal">
          <div className="modal-content">
            <h2>Reservation Details</h2>
            <div className="reservation-details">
              <p>
                <strong>Reservation ID:</strong>{" "}
                {selectedReservation.reservation_id}
              </p>
              <p>
                <strong>Name:</strong> {selectedReservation.name}
              </p>
              <p>
                <strong>Phone Number:</strong> {selectedReservation.phoneNumber}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {formatDate(selectedReservation.reservation_date)}
              </p>
              <p>
                <strong>Time Slot:</strong> {selectedReservation.timeSlot}
              </p>
              <p>
                <strong>Number of Guests:</strong>{" "}
                {selectedReservation.numberOfPax}
              </p>
              <p>
                <strong>Venue:</strong> {selectedReservation.venue}
              </p>
              <p>
                <strong>Payment Mode:</strong> {selectedReservation.paymentMode}
              </p>
              <p>
                <strong>Total Amount:</strong> ₱
                {selectedReservation.total_amount.toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedReservation.reservation_status}
              </p>
              {selectedReservation.specialNotes && (
                <p>
                  <strong>Special Notes:</strong>{" "}
                  {selectedReservation.specialNotes}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={closeReservationDetails}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReservations;
