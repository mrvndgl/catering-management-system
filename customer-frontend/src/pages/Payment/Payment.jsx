import React, { useState, useEffect } from "react";
import "./Payment.css";

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

  useEffect(() => {
    fetchAcceptedReservations();
    fetchProducts();
    fetchPaymentStatuses();
  }, []);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/notifications/unread", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setNotifications(data);
            // Refresh the payments list if there are new notifications
            fetchAcceptedReservations();
            fetchPaymentStatuses();
          }
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    // Check for notifications every 30 seconds
    const intervalId = setInterval(checkNotifications, 30000);

    // Initial check
    checkNotifications();

    // Cleanup
    return () => clearInterval(intervalId);
  }, []);

  const fetchPaymentStatuses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payments/status", {
        // Match the route in your router
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch payment statuses"
        );
      }

      const data = await response.json();
      // Your backend returns data in { success: true, data: [...] } format
      if (data.success && Array.isArray(data.data)) {
        const statusMap = data.data.reduce((acc, payment) => {
          acc[payment.reservation_id] = payment.payment_status;
          return acc;
        }, {});
        setPaymentStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching payment statuses:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching products..."); // Debug log

      // First, get all products
      const response = await fetch("/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

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

      const response = await fetch("/api/reservations/my-accepted", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        credentials: "include",
      });

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
        setError("Please upload your payment screenshot");
        return;
      }

      setError(null);
      setSuccessMessage("");

      const formData = new FormData();
      formData.append("payment_proof", paymentProof);
      formData.append("reservation_id", reservationId);
      formData.append("payment_method", "GCash");

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/payments/${reservationId}/proof`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload payment proof");
      }

      const data = await response.json();
      setSuccessMessage("Payment proof uploaded successfully!");
      setPaymentMethod(null);
      setSelectedReservation(null);
      setPaymentProof(null);

      setPaymentStatuses((prev) => ({
        ...prev,
        [reservationId]: "Pending",
      }));

      await fetchAcceptedReservations();
    } catch (error) {
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
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          payment_method: "Cash",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to submit cash payment information"
        );
      }

      const data = await response.json();
      setSuccessMessage(
        "Cash payment information submitted successfully! The owner will contact you shortly."
      );
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
      setError(error.message);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "Pending":
        return <div className="status-badge pending">Payment Pending</div>;
      case "Accepted":
        return <div className="status-badge accepted">Payment Accepted</div>;
      case "Declined":
        return <div className="status-badge declined">Payment Declined</div>;
      default:
        return null;
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
        <div className="card-header">
          <h2>Your Payments</h2>
        </div>

        <div className="card-content">
          {error && <div className="error-alert">{error}</div>}
          {successMessage && (
            <div className="success-alert">{successMessage}</div>
          )}

          {acceptedReservations.length === 0 ? (
            <p className="no-payments-message">
              No pending payments found. All your accepted reservations are
              paid.
            </p>
          ) : (
            <div className="reservations-grid">
              {acceptedReservations.map((reservation) => (
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
