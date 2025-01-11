import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminReservations.css";

const AdminReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [products, setProducts] = useState({}); // Store product data from database
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleReservationAction = async (reservationId, status) => {
    try {
      const token = localStorage.getItem("token");

      // Check existing reservations for the day if trying to accept
      if (status === "Accepted") {
        const reservation = reservations.find(
          (r) => r.reservation_id === reservationId
        );

        const existingReservations = await fetch(
          `/api/reservations/date/${reservation.reservation_date}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((res) => res.json());

        // Filter accepted reservations for the same day
        const acceptedReservations = existingReservations.filter(
          (r) => r.reservation_status === "Accepted"
        );

        // Check if there are already 2 accepted reservations
        if (acceptedReservations.length >= 2) {
          setError("Maximum reservations for this day has been reached");
          return;
        }

        // Check if there's already a reservation in the same time slot
        const sameTimeSlot = acceptedReservations.some(
          (r) => r.timeSlot === reservation.timeSlot
        );
        if (sameTimeSlot) {
          setError("This time slot is already taken for this day");
          return;
        }
      }

      // Update reservation status
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservation_status: status,
          paymentRedirect: status === "Accepted",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Failed to update reservation status to ${status}`
        );
      }

      // Update local state
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.reservation_id === reservationId
            ? { ...reservation, reservation_status: status }
            : reservation
        )
      );

      // If accepted, send payment notification
      if (status === "Accepted") {
        try {
          const notificationResponse = await fetch(
            `/api/notifications/payment-required/${reservationId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!notificationResponse.ok) {
            console.error("Failed to send payment notification");
          }
        } catch (notificationError) {
          console.error(
            "Error sending payment notification:",
            notificationError
          );
          // Don't throw here - we still want to consider the acceptance successful
        }
      }

      // Clear any existing errors on success
      setError(null);
    } catch (err) {
      console.error("Error updating reservation:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchProducts();
  }, []);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/reservations", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/products", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      const productsLookup = data.reduce((acc, product) => {
        acc[product._id] = product;
        return acc;
      }, {});

      setProducts(productsLookup);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError(error.message);
    }
  };

  const getProductName = (productId) => {
    const product = products[productId];
    return product ? product.product_name : "Loading...";
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
                    {(reservation.reservation_status || "")
                      .toLowerCase()
                      .trim() === "pending" && (
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

              {/* Selected Menu Items Section */}
              <div className="selected-items-section">
                <h3>Selected Menu Items</h3>
                <div className="menu-items-list">
                  {selectedReservation.selectedProducts &&
                    Object.entries(selectedReservation.selectedProducts).map(
                      ([category, productId]) => (
                        <p key={category}>
                          <strong>{category}:</strong>{" "}
                          {getProductName(productId)}
                        </p>
                      )
                    )}
                </div>
              </div>

              {/* Additional Items Section */}
              {selectedReservation.additionalItems &&
                selectedReservation.additionalItems.length > 0 && (
                  <div className="additional-items-section">
                    <h3>Additional Items</h3>
                    <div className="additional-items-list">
                      {selectedReservation.additionalItems.map(
                        (productId, index) => (
                          <p key={index}>{getProductName(productId)}</p>
                        )
                      )}
                    </div>
                  </div>
                )}

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
