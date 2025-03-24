import React, { useState, useEffect } from "react";
import "./Payment.css";
import Swal from "sweetalert2";

const Payment = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptedReservations, setAcceptedReservations] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [products, setProducts] = useState({});
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchAcceptedReservations();
    fetchProducts();
    fetchPaymentStatuses();
  }, []);

  useEffect(() => {
    const checkReservationStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/reservations/my-reservations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          const latestReservation = data.data[0];

          switch (latestReservation.reservation_status) {
            case "Accepted":
              Swal.fire({
                title: "Reservation Accepted!",
                text: "Your reservation has been accepted. Please proceed with the payment.",
                icon: "success",
                confirmButtonColor: "#28a745",
              });
              await fetchAcceptedReservations();
              break;
            case "Declined":
              Swal.fire({
                title: "Reservation Declined",
                text:
                  latestReservation.decline_reason ||
                  "Your reservation has been declined.",
                icon: "error",
                confirmButtonColor: "#dc3545",
              });
              break;
          }
        }
      } catch (error) {
        console.error("Error checking reservation status:", error);
        // Only show error alert if it's not a network connectivity issue
        if (error.message !== "Failed to fetch") {
          Swal.fire({
            title: "Error",
            text: "Failed to check reservation status. Please try again later.",
            icon: "error",
            confirmButtonColor: "#dc3545",
          });
        }
      }
    };

    // Initial check
    checkReservationStatus();

    // Set up interval with a longer delay to prevent too many requests
    const intervalId = setInterval(checkReservationStatus, 30000); // Changed to 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchPaymentStatuses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment statuses");
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const statusMap = {};
        data.data.forEach((payment) => {
          statusMap[payment.reservation_id] = {
            status: payment.payment_status,
            method: payment.payment_method,
            amount: payment.amount,
            date: payment.created_at,
            proof: payment.payment_proof,
          };
        });
        setPaymentStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching payment statuses:", error);
      setError("Failed to fetch payment history");
    }
  };

  const filterReservations = (reservations) => {
    if (!Array.isArray(reservations)) return [];

    return reservations.filter((reservation) => {
      const paymentStatus = paymentStatuses[reservation.reservation_id];
      if (activeTab === "pending") {
        return !paymentStatus || paymentStatus.status === "Pending";
      }
      return (
        paymentStatus && ["Accepted", "Paid"].includes(paymentStatus.status)
      );
    });
  };

  const getStatusDisplay = (payment) => {
    const statusClasses = {
      Pending: "pending",
      Accepted: "accepted",
      Paid: "completed",
      Declined: "declined",
    };

    return (
      <div className={`status-badge ${statusClasses[payment.status] || ""}`}>
        {payment.status === "Pending" && "Payment Pending"}
        {payment.status === "Accepted" && "Payment Accepted"}
        {payment.status === "Paid" && "Payment Completed"}
        {payment.status === "Declined" && "Payment Declined"}
      </div>
    );
  };

  // Add this helper function to display payment details
  const getPaymentDetails = (reservation) => {
    const payment = paymentStatuses[reservation.reservation_id];
    if (!payment) return null;

    return (
      <div className="payment-history-details">
        <p>
          <span className="label">Payment Status:</span>{" "}
          {getStatusDisplay(payment.status)}
        </p>
        <p>
          <span className="label">Payment Method:</span> {payment.method}
        </p>
        <p>
          <span className="label">Payment Date:</span>{" "}
          {new Date(payment.date).toLocaleDateString()}
        </p>
        {payment.proof && (
          <div className="payment-proof">
            <span className="label">Payment Proof:</span>
            <img
              src={`${import.meta.env.VITE_API_URL}/api/payments/proof/${
                payment.proof
              }`}
              alt="Payment proof"
              className="proof-thumbnail"
              onClick={() => {
                /* Add image preview handler */
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching products..."); // Debug log

      // First, get all products
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const productsData = await response.json();
      console.log("Products received:", productsData); // Debug log

      // Create a map using MongoDB _id as the key
      const productMap = productsData.reduce((acc, product) => {
        acc[product._id] = product.product_name;
        return acc;
      }, {});

      console.log("Product map created:", productMap); // Debug log
      setProducts(productMap);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message);
    }
  };

  const fetchAcceptedReservations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fix for the 404 error - add the /api prefix to match your routes
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/reservations/my-accepted`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch accepted reservations"
        );
      }

      const data = await response.json();
      const reservationsArray = Array.isArray(data) ? data : [];
      setAcceptedReservations(reservationsArray);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError(error.message);
      setIsLoading(false);
      setAcceptedReservations([]);
    }
  };

  const handlePaymentMethodSelect = (reservationId, method) => {
    setSelectedReservation(reservationId);
    setPaymentMethod(method);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  const handleGCashSubmit = async (reservationId) => {
    try {
      if (!paymentProof) {
        Swal.fire({
          title: "Error!",
          text: "Please upload your payment screenshot",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
        return;
      }

      setError(null);
      setSuccessMessage("");

      const formData = new FormData();
      formData.append("payment_proof", paymentProof);
      formData.append("reservation_id", reservationId);
      formData.append("payment_method", "GCash");

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || ""
        }/api/payments/${reservationId}/proof`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload payment proof");
      }

      const data = await response.json();
      Swal.fire({
        title: "Success!",
        text: "Payment proof uploaded successfully!",
        icon: "success",
        confirmButtonColor: "#28a745",
      });

      setPaymentMethod(null);
      setSelectedReservation(null);
      setPaymentProof(null);
      await fetchAcceptedReservations();
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to upload payment proof",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Payment error:", error);
      setError(error.message || "Failed to upload payment proof");

      setPaymentProof(null);
      const fileInput = document.querySelector(".file-input");
      if (fileInput) {
        fileInput.value = "";
      }
    }
  };

  const handleCashPayment = async (reservationId) => {
    try {
      // Show loading alert
      Swal.fire({
        title: "Processing",
        text: "Submitting payment information...",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reservation_id: reservationId,
            payment_method: "Cash",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to submit cash payment information"
        );
      }

      const data = await response.json();

      // Success alert
      Swal.fire({
        title: "Success!",
        text: "Cash payment information submitted successfully! The owner will contact you shortly.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });

      setPaymentMethod(null);
      setSelectedReservation(null);

      // Update payment status locally
      setPaymentStatuses((prev) => ({
        ...prev,
        [reservationId]: "Pending",
      }));

      await fetchAcceptedReservations();
    } catch (error) {
      console.error("Payment error:", error);

      // Error alert
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });

      setError(error.message);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    try {
      // Confirm with user first
      const result = await Swal.fire({
        title: "Cancel Reservation",
        text: "Are you sure you want to cancel this reservation? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#007BFF",
        confirmButtonText: "Yes, cancel it!",
        cancelButtonText: "No, keep it",
      });

      if (!result.isConfirmed) {
        return;
      }

      // Show loading state
      Swal.fire({
        title: "Processing",
        text: "Cancelling your reservation...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Make the API call to cancel the reservation
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/reservations/${reservationId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel reservation");
      }

      // Show success message
      await Swal.fire({
        title: "Success!",
        text: "Your reservation has been cancelled successfully.",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });

      // Refresh the data
      await Promise.all([fetchAcceptedReservations(), fetchPaymentStatuses()]);

      // Update local state to reflect cancellation
      setAcceptedReservations((prev) =>
        prev.map((res) =>
          res.reservation_id === reservationId
            ? { ...res, reservation_status: "Cancelled" }
            : res
        )
      );
    } catch (error) {
      console.error("Error cancelling reservation:", error);

      // Show error message
      await Swal.fire({
        title: "Error!",
        text:
          error.message || "An error occurred while cancelling the reservation",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  if (isLoading) {
    return <div className="loading-message">Loading payments...</div>;
  }

  return (
    <div className="payments-container">
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map((notification) => (
            <div key={notification._id} className="notification-item">
              <p>{notification.message}</p>
              {notification.type === "PAYMENT_REQUIRED" && (
                <button
                  onClick={() => {
                    const reservation = acceptedReservations.find(
                      (r) => r.reservation_id === notification.reservation_id
                    );
                    if (reservation) {
                      // Scroll to the reservation card
                      document
                        .getElementById(
                          `reservation-${notification.reservation_id}`
                        )
                        ?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  View Payment Details
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="payments-card">
        <div className="payment-tabs">
          <button
            className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Payments
          </button>
          <button
            className={`tab-button ${activeTab === "paid" ? "active" : ""}`}
            onClick={() => setActiveTab("paid")}
          >
            Payment History
          </button>
        </div>

        <div className="card-content">
          {error && <div className="error-alert">{error}</div>}
          {successMessage && (
            <div className="success-alert">{successMessage}</div>
          )}

          {filterReservations(acceptedReservations).length === 0 ? (
            <p className="no-payments-message">
              {activeTab === "pending"
                ? "No pending payments found."
                : "No payment history found."}
            </p>
          ) : (
            <div className="reservations-grid">
              {filterReservations(acceptedReservations).map((reservation) => (
                <div
                  key={reservation.reservation_id}
                  className="reservation-card"
                >
                  <div className="reservation-header">
                    <h3>Reservation #{reservation.reservation_id}</h3>
                    {paymentStatuses[reservation.reservation_id] &&
                      getStatusDisplay(
                        paymentStatuses[reservation.reservation_id]
                      )}
                  </div>

                  <div className="reservation-details">
                    <p>
                      <span className="label">Customer Name:</span>{" "}
                      {reservation.name}
                    </p>
                    <p>
                      <span className="label">Phone Number:</span>{" "}
                      {reservation.phoneNumber}
                    </p>
                    <p>
                      <span className="label">Number of Pax:</span>{" "}
                      {reservation.numberOfPax}
                    </p>
                    <p>
                      <span className="label">Time Slot:</span>{" "}
                      {reservation.timeSlot}
                    </p>
                    <p>
                      <span className="label">Date:</span>{" "}
                      {new Date(
                        reservation.reservation_date
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="label">Venue:</span> {reservation.venue}
                    </p>
                    <p>
                      <span className="label">Payment Mode:</span>{" "}
                      {reservation.paymentMode}
                    </p>
                    <p>
                      <span className="label">Amount Due:</span> ₱
                      {reservation.total_amount?.toLocaleString()}
                    </p>

                    {reservation.specialNotes && (
                      <p>
                        <span className="label">Special Notes:</span>{" "}
                        {reservation.specialNotes}
                      </p>
                    )}

                    <div className="menu-details">
                      <h4>Selected Items:</h4>
                      <ul>
                        {Object.entries(reservation.selectedProducts).map(
                          ([category, productId]) => (
                            <li key={category}>
                              {category}: {products[productId] || "Loading..."}
                            </li>
                          )
                        )}
                      </ul>

                      {reservation.additionalItems?.length > 0 && (
                        <>
                          <h4>Additional Items:</h4>
                          <ul>
                            {reservation.additionalItems.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>

                  {!paymentStatuses[reservation.reservation_id] && (
                    <>
                      {!paymentMethod && (
                        <div className="payment-buttons">
                          <button
                            className="payment-button gcash"
                            onClick={() =>
                              handlePaymentMethodSelect(
                                reservation.reservation_id,
                                "GCash"
                              )
                            }
                          >
                            Pay with GCash
                          </button>
                          <button
                            className="payment-button cash"
                            onClick={() =>
                              handlePaymentMethodSelect(
                                reservation.reservation_id,
                                "Cash"
                              )
                            }
                          >
                            Pay in Cash
                          </button>
                        </div>
                      )}

                      {!paymentStatuses[reservation.reservation_id] && (
                        <button
                          className="cancel-button"
                          onClick={() =>
                            handleCancelReservation(reservation.reservation_id)
                          }
                        >
                          Cancel Reservation
                        </button>
                      )}

                      {paymentMethod === "Cash" &&
                        selectedReservation === reservation.reservation_id && (
                          <div className="payment-instructions cash">
                            <h4>Cash Payment Instructions</h4>
                            <p>
                              If you prefer to pay with cash, kindly provide
                              your mobile number so that you and the staff can
                              schedule a time for the payment to be processed.
                            </p>
                            <p className="contact-numbers">
                              Kindly give the following mobile numbers a call:
                              09358276798 / 09207129412
                            </p>
                            <p>
                              It is required that at least half of the
                              reservation's total cost be paid in advance.
                            </p>
                            <div className="action-buttons">
                              <button
                                className="submit-button"
                                onClick={() =>
                                  handleCashPayment(reservation.reservation_id)
                                }
                              >
                                Confirm Cash Payment
                              </button>
                              <button
                                className="close-button"
                                onClick={() => {
                                  setPaymentMethod(null);
                                  setSelectedReservation(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                      {paymentMethod === "GCash" &&
                        selectedReservation === reservation.reservation_id && (
                          <div className="payment-instructions gcash">
                            <h4>GCash Payment Instructions</h4>
                            <p>
                              Please upload a screenshot of your GCash payment.
                            </p>
                            <p>
                              At least half of the total amount must be paid in
                              advance.
                            </p>
                            <div className="file-upload">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="file-input"
                              />
                            </div>
                            <div className="action-buttons">
                              <button
                                className="submit-button"
                                onClick={() =>
                                  handleGCashSubmit(reservation.reservation_id)
                                }
                              >
                                Submit Payment
                              </button>
                              <button
                                className="close-button"
                                onClick={() => {
                                  setPaymentMethod(null);
                                  setSelectedReservation(null);
                                  setPaymentProof(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;
