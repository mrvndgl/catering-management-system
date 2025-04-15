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
  const [productsLookup, setProductsLookup] = useState({});
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

        console.log("API URL:", import.meta.env.VITE_API_URL);
        console.log(
          "Full Fetch URL:",
          `${import.meta.env.VITE_API_URL}/api/reservations/my-reservations`
        );

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/reservations/my-reservations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        // Log full response details
        console.log("Response Status:", response.status);
        console.log(
          "Response Headers:",
          Object.fromEntries(response.headers.entries())
        );

        if (!response.ok) {
          // Try to get error details from response
          const errorText = await response.text();
          console.error("Error Response Text:", errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, details: ${errorText}`
          );
        }

        const data = await response.json();
        console.log("Received Data:", data);

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
        console.error("Detailed Error Checking Reservation Status:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
          apiUrl: import.meta.env.VITE_API_URL,
        });

        // Differentiate between different types of network errors
        if (error instanceof TypeError) {
          Swal.fire({
            title: "Network Error",
            text: "Unable to connect to the server. Please check your internet connection.",
            icon: "error",
            confirmButtonColor: "#dc3545",
          });
        } else {
          Swal.fire({
            title: "Error",
            text: `Failed to check reservation status: ${error.message}`,
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
      console.log("Payment statuses data:", data); // For debugging

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
        console.log("Processed payment status map:", statusMap); // For debugging
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
        // Only show reservations with NO payment submission yet
        return !paymentStatus;
      } else {
        // "paid" tab (payment history)
        // Show ANY reservation with a payment status (even if it's pending)
        return paymentStatus !== undefined;
      }
    });
  };

  const getStatusDisplay = (payment) => {
    if (!payment) return null;

    // Handle both string and object formats
    const status = typeof payment === "string" ? payment : payment.status;

    const statusClasses = {
      Pending: "pending",
      Accepted: "accepted",
      Paid: "completed",
      "Fully Paid": "completed",
      Downpayment: "partial",
      Completed: "completed",
      Declined: "declined",
    };

    return (
      <div className={`status-badge ${statusClasses[status] || ""}`}>
        {status === "Pending" && "PENDING"}
        {status === "Accepted" && "ACCEPTED"}
        {status === "Paid" && "COMPLETED"}
        {status === "Fully Paid" && "FULLY PAID"}
        {status === "Downpayment" && "DOWNPAYMENT"}
        {status === "Completed" && "COMPLETED"}
        {status === "Declined" && "DECLINED"}
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
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

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

      // Create a lookup object with both _id and product_id as keys
      const lookup = productsData.reduce((acc, product) => {
        acc[product._id] = product;
        // Also add an entry with product_id if it exists
        if (product.product_id) {
          acc[product.product_id] = product;
        }
        return acc;
      }, {});

      setProductsLookup(lookup);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setIsLoading(false);
    }
  };

  const getProductName = (productId) => {
    if (!productId) return "No product selected";
    if (!productsLookup) return "Loading products...";

    const product = productsLookup[productId];

    // Debug logging
    if (!product) {
      console.warn(
        `Product ID ${productId} not found in lookup`,
        productsLookup
      );
      return "Product not found";
    }

    return product.product_name || "Unnamed product";
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
        `${import.meta.env.VITE_API_URL || ""}/api/payments/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload payment proof");
      }

      Swal.fire({
        title: "Success!",
        text: "Payment proof uploaded successfully!",
        icon: "success",
        confirmButtonColor: "#28a745",
      });

      setPaymentMethod(null);
      setSelectedReservation(null);
      setPaymentProof(null);

      // Refresh both data sources
      await Promise.all([fetchAcceptedReservations(), fetchPaymentStatuses()]);
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

      // Update payment status locally with correct structure
      setPaymentStatuses((prev) => ({
        ...prev,
        [reservationId]: {
          status: "Pending",
          method: "Cash",
          amount: null,
          date: new Date().toISOString(),
        },
      }));

      // Fetch updated data from server
      await Promise.all([fetchAcceptedReservations(), fetchPaymentStatuses()]);

      // Switch to payment history tab
      setActiveTab("paid");
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
        console.error("Cancellation Error Response:", {
          status: response.status,
          body: data,
        });
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
      console.error("Detailed Cancellation Error:", {
        message: error.message,
        reservationId,
      });

      // Show error message
      await Swal.fire({
        title: "Error!",
        text:
          error.message ||
          "An unexpected error occurred while cancelling the reservation",
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
                        paymentStatuses[reservation.reservation_id].status
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
                      <h4>Selected Products:</h4>
                      {isLoading ? (
                        <p>Loading products...</p>
                      ) : reservation && reservation.selectedProducts ? (
                        <ul>
                          {Object.entries(reservation.selectedProducts).map(
                            ([category, productId]) => (
                              <li key={category}>
                                {category}: {getProductName(productId)}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p>No items selected</p>
                      )}

                      {/* Additional items */}
                      {reservation &&
                        reservation.additionalItems?.length > 0 && (
                          <>
                            <h4>Additional Items:</h4>
                            <ul>
                              {reservation.additionalItems.map(
                                (itemId, index) => (
                                  <li key={index}>{getProductName(itemId)}</li>
                                )
                              )}
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
                                className="cash-button"
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
