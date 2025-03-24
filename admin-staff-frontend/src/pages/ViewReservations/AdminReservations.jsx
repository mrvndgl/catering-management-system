import React, { useState, useEffect } from "react";
import "./AdminReservations.css";
import Swal from "sweetalert2";

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [products, setProducts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [declineNote, setDeclineNote] = useState("");
  const [showDeclineNoteModal, setShowDeclineNoteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: "", id: null });

  const handleReservationAction = async (
    reservationId,
    status,
    note = null
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      setIsLoading(true);

      // Prepare request body
      const requestBody = {
        reservation_status: status,
      };

      if (status === "Declined" && note) {
        requestBody.decline_reason = note;
      }

      // Update reservation status
      const updateResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update reservation`);
      }

      const updatedReservation = await updateResponse.json();

      // Update local state
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.reservation_id === reservationId
            ? {
                ...reservation,
                reservation_status: status,
                decline_reason:
                  status === "Declined" && note
                    ? note
                    : reservation.decline_reason,
              }
            : reservation
        )
      );

      // Show success message based on action
      if (status === "Accepted") {
        Swal.fire({
          title: "Reservation Accepted!",
          text: "The customer will be notified to proceed with payment.",
          icon: "success",
          confirmButtonColor: "#28a745",
        });
        await handlePaymentSetup(reservationId, updatedReservation.customer_id);
      } else if (status === "Declined") {
        Swal.fire({
          title: "Reservation Declined",
          text: `Reservation has been declined. Reason: ${
            note || "Not specified"
          }`,
          icon: "info",
          confirmButtonColor: "#dc3545",
        });
      }

      setError(null);
      await fetchReservations();
    } catch (err) {
      console.error("Error updating reservation:", err);
      Swal.fire({
        title: "Error!",
        text: err.message || "Failed to update reservation",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      setError(err.message || "Failed to update reservation");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this helper function for payment setup
  const handlePaymentSetup = async (reservationId, customerId) => {
    const token = localStorage.getItem("token");
    try {
      const paymentResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/reservations/${reservationId}/payment`,
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
        throw new Error("Failed to initialize payment requirements");
      }
    } catch (error) {
      console.error("Error setting up payment:", error);
    }
  };

  const handleDeclineWithNote = () => {
    if (selectedReservation) {
      handleReservationAction(
        selectedReservation.reservation_id,
        "Declined",
        declineNote
      );
      setShowDeclineNoteModal(false);
      setDeclineNote("");
      closeReservationDetails();
    }
  };

  const openDeclineNoteModal = () => {
    setShowDeclineNoteModal(true);
  };

  const closeDeclineNoteModal = () => {
    setShowDeclineNoteModal(false);
    setDeclineNote("");
  };

  const handleConfirmAction = () => {
    if (confirmAction.type === "accept") {
      handleReservationAction(selectedReservation.reservation_id, "Accepted");
      closeReservationDetails();
    } else if (confirmAction.type === "decline") {
      openDeclineNoteModal();
    }
    setShowConfirmModal(false);
  };

  const openConfirmModal = (type) => {
    setConfirmAction({ type, id: selectedReservation.reservation_id });
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction({ type: "", id: null });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      return "N/A";
    }

    try {
      // Parse the ISO string to Date object
      const date = new Date(timestamp);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", timestamp);
        return "N/A";
      }

      // Format the date
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "N/A";
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
      console.log("Reservation data from API:", data);
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
      // Update the API endpoint to match server route
      const response = await fetch("/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw products data:", data); // Debug log

      // Create a lookup object with proper product IDs
      const productsLookup = data.reduce((acc, product) => {
        acc[product._id] = product;
        return acc;
      }, {});

      setProducts(productsLookup);
      console.log("Products lookup:", productsLookup); // Debug log
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message);
    }
  };

  const getProductName = (productId) => {
    console.log("Looking up product ID:", productId); // Debug log
    const product = products[productId];
    return product
      ? product.product_name
      : `Product not found (ID: ${productId})`;
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

  const getPaymentStatusDisplay = (reservationId, paymentMode) => {
    const status = paymentStatuses[reservationId];

    // If there's a payment mode but no status yet
    if (paymentMode && !status) {
      return (
        <span className="payment-status pending">
          Payment Mode: {paymentMode}
        </span>
      );
    }

    // If there's a status, show both payment mode and status
    if (status) {
      switch (status) {
        case "Pending":
          return (
            <span className="payment-status pending">
              Pending ({paymentMode})
            </span>
          );
        case "Paid":
          return (
            <span className="payment-status paid">Paid ({paymentMode})</span>
          );
        case "Failed":
          return (
            <span className="payment-status failed">
              Failed ({paymentMode})
            </span>
          );
        case "Declined":
          return (
            <span className="payment-status declined">
              Declined ({paymentMode})
            </span>
          );
        default:
          return (
            <span className="payment-status">Unknown ({paymentMode})</span>
          );
      }
    }

    return <span className="payment-status">No Payment Method Selected</span>;
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
                <td>
                  {getPaymentStatusDisplay(
                    reservation.reservation_id,
                    reservation.paymentMode
                  )}
                </td>
                <td className="actions-cell">
                  <button
                    className="view-btn"
                    onClick={() => viewReservationDetails(reservation)}
                  >
                    View
                  </button>
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
                    <strong>Reservation Made:</strong>{" "}
                    {formatTimestamp(selectedReservation?.createdAt)}
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
                  {selectedReservation.decline_reason && (
                    <p>
                      <strong>Decline Reason:</strong>{" "}
                      {selectedReservation.decline_reason}
                    </p>
                  )}
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

              {selectedReservation?.additionalItems?.length > 0 && (
                <div className="additional-items-section">
                  <h3>Additional Items</h3>
                  <div className="additional-items-list">
                    {selectedReservation.additionalItems.map(
                      (productId, index) => (
                        <p key={`additional-${productId}-${index}`}>
                          {getProductName(productId)}
                        </p>
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
                      onClick={() => openConfirmModal("accept")}
                    >
                      Accept
                    </button>
                    <button
                      className="decline-btn"
                      onClick={() => openConfirmModal("decline")}
                    >
                      Decline
                    </button>
                  </div>
                )}

              {showConfirmModal && (
                <div className="confirmation-modal">
                  <div className="modal-content">
                    <h2>Confirm Action</h2>
                    <p>
                      Are you sure you want to {confirmAction.type} this
                      reservation?
                    </p>
                    <div className="modal-actions">
                      <button
                        className={`confirm-btn ${confirmAction.type}`}
                        onClick={handleConfirmAction}
                      >
                        Yes,{" "}
                        {confirmAction.type === "accept" ? "Accept" : "Decline"}
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={closeConfirmModal}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showDeclineNoteModal && (
                <div className="decline-note-modal">
                  <div className="modal-content">
                    <h2>Decline Reservation</h2>
                    <p>
                      Please provide a reason for declining this reservation:
                    </p>
                    <textarea
                      className="decline-note-textarea"
                      value={declineNote}
                      onChange={(e) => setDeclineNote(e.target.value)}
                      placeholder="Enter reason for declining (e.g., Venue unavailable, Fully booked, etc.)"
                      rows={4}
                    />
                    <div className="modal-actions">
                      <button
                        className="confirm-btn"
                        onClick={handleDeclineWithNote}
                        disabled={!declineNote.trim()}
                      >
                        Confirm Decline
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={closeDeclineNoteModal}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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

export default AdminReservations;
