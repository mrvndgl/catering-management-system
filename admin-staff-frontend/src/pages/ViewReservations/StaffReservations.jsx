import React, { useState, useEffect } from "react";
import "./StaffReservations.css";

const StaffReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [products, setProducts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");

  const handleReservationAction = async (reservationId, status) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      setIsLoading(true);

      // Update reservation status using the correct endpoint from reservationRoute.js
      const updateResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reservation_status: status,
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to update reservation (Status: ${updateResponse.status})`
        );
      }

      const updatedReservation = await updateResponse.json();

      // Update local state
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.reservation_id === reservationId
            ? { ...reservation, reservation_status: status }
            : reservation
        )
      );

      // If accepted, update payment status
      if (status === "Accepted") {
        try {
          // Update payment status using the correct endpoint
          const paymentResponse = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/reservations/${reservationId}/payment`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                payment_status: "Pending",
                payment_required: true,
              }),
            }
          );

          if (!paymentResponse.ok) {
            console.warn(
              "Failed to mark payment as required:",
              await paymentResponse.text()
            );
          }

          // Send notification if you have a notifications endpoint
          // Note: You'll need to add a notifications route to your backend
          try {
            const notificationResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/notifications`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  reservation_id: reservationId,
                  type: "PAYMENT_REQUIRED",
                  message:
                    "Your reservation has been accepted. Please proceed with the payment.",
                  user_id: updatedReservation.customer_id,
                }),
              }
            );

            if (!notificationResponse.ok) {
              console.warn(
                "Failed to send notification:",
                await notificationResponse.text()
              );
            }
          } catch (notificationError) {
            console.error("Error sending notification:", notificationError);
          }
        } catch (error) {
          console.error("Error in post-acceptance actions:", error);
        }
      }

      setError(null);
      await Promise.all([fetchReservations(), fetchPaymentStatuses()]);
    } catch (err) {
      console.error("Error updating reservation:", err);
      setError(
        err.message ||
          "Failed to update reservation. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchProducts();
    fetchPaymentStatuses();
  }, []);

  const fetchPaymentStatuses = async () => {
    try {
      const token = localStorage.getItem("token");
      // Update the endpoint to the correct one
      const response = await fetch("/api/payments/status", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payment statuses");
      }

      const result = await response.json();
      if (Array.isArray(result)) {
        // Modified to handle direct array response
        const statusMap = result.reduce((acc, payment) => {
          if (
            !acc[payment.reservation_id] ||
            new Date(payment.created_at) >
              new Date(acc[payment.reservation_id].created_at)
          ) {
            acc[payment.reservation_id] = payment;
          }
          return acc;
        }, {});

        const finalMap = {};
        for (const [resId, payment] of Object.entries(statusMap)) {
          finalMap[resId] = payment.status; // Update to match your payment status field
        }

        setPaymentStatuses(finalMap);
      }
    } catch (error) {
      console.error("Error fetching payment statuses:", error);
      // Add fallback behavior when payment status fetch fails
      setPaymentStatuses({});
    }
  };

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
    // Use a safer date formatting approach
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const viewReservationDetails = (reservation) => {
    setSelectedReservation(reservation);
  };

  const closeReservationDetails = () => {
    setSelectedReservation(null);
  };

  const getPaymentStatusDisplay = (reservationId) => {
    const status = paymentStatuses[reservationId];
    if (!status) return "No Payment";

    switch (status) {
      case "Pending":
        return <span className="payment-status pending">Payment Pending</span>;
      case "Paid":
        return <span className="payment-status paid">Paid</span>;
      case "Failed":
        return <span className="payment-status failed">Payment Failed</span>;
      case "Declined":
        return (
          <span className="payment-status declined">Payment Declined</span>
        );
      default:
        return <span className="payment-status">Unknown</span>;
    }
  };

  const filteredReservations =
    filterStatus === "all"
      ? reservations
      : reservations.filter((res) => res.reservation_status === filterStatus);

  return (
    <div className="admin-reservations-container">
      {error && <div className="error-message">{error}</div>}

      <div className="filter-controls">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Reservations</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button
          className="refresh-button"
          onClick={() => {
            fetchReservations();
            fetchPaymentStatuses();
          }}
        >
          Refresh Data
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading reservations...</div>
      ) : filteredReservations.length === 0 ? (
        <div className="no-reservations">No reservations found</div>
      ) : (
        <table className="reservations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Time Slot</th>
              <th>Pax</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map((reservation) => (
              <tr key={reservation.reservation_id}>
                <td>{reservation.reservation_id}</td>
                <td>{reservation.name}</td>
                <td>{formatDate(reservation.reservation_date)}</td>
                <td>{reservation.timeSlot}</td>
                <td>{reservation.numberOfPax}</td>
                <td>₱{reservation.total_amount?.toLocaleString()}</td>
                <td>
                  <span
                    className={`status-badge ${reservation.reservation_status.toLowerCase()}`}
                  >
                    {reservation.reservation_status}
                  </span>
                </td>
                <td>{getPaymentStatusDisplay(reservation.reservation_id)}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="view-btn"
                      onClick={() => viewReservationDetails(reservation)}
                    >
                      View
                    </button>
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
              <div className="detail-headers">
                <div className="details-left">
                  <p>
                    <strong>Reservation ID:</strong>{" "}
                    {selectedReservation.reservation_id}
                  </p>
                  <p>
                    <strong>Name:</strong> {selectedReservation.name}
                  </p>
                  <p>
                    <strong>Phone Number:</strong>{" "}
                    {selectedReservation.phoneNumber}
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
                </div>
                <div className="details-right">
                  <p>
                    <strong>Venue:</strong> {selectedReservation.venue}
                  </p>
                  <p>
                    <strong>Payment Mode:</strong>{" "}
                    {selectedReservation.paymentMode}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> ₱
                    {selectedReservation.total_amount?.toLocaleString()}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`status-badge ${selectedReservation.reservation_status.toLowerCase()}`}
                    >
                      {selectedReservation.reservation_status}
                    </span>
                  </p>
                  <p>
                    <strong>Payment Status:</strong>{" "}
                    {getPaymentStatusDisplay(
                      selectedReservation.reservation_id
                    )}
                  </p>
                </div>
              </div>

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
              {selectedReservation &&
                selectedReservation.reservation_status.toLowerCase() ===
                  "pending" && (
                  <div className="reservation-action-buttons">
                    <button
                      className="accept-btn"
                      onClick={() => {
                        handleReservationAction(
                          selectedReservation.reservation_id,
                          "Accepted"
                        );
                        closeReservationDetails();
                      }}
                    >
                      Accept
                    </button>
                    <button
                      className="decline-btn"
                      onClick={() => {
                        handleReservationAction(
                          selectedReservation.reservation_id,
                          "Declined"
                        );
                        closeReservationDetails();
                      }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              <button className="close-btn" onClick={closeReservationDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReservations;
