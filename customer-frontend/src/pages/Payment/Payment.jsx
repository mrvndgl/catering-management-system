import React, { useState, useEffect } from "react";
import "./Payment.css";

const Payment = () => {
  const [payments, setPayments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptedReservations, setAcceptedReservations] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    facebookAccount: "",
    mobileNumber: "",
  });

  useEffect(() => {
    fetchAcceptedReservations();
  }, []);

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

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch accepted reservations"
        );
      }

      const data = await response.json();
      console.log("Received data:", data);

      // Ensure we have an array even if the response is empty
      const reservationsArray = Array.isArray(data) ? data : [];

      setAcceptedReservations(reservationsArray);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError(error.message);
      setIsLoading(false);
      setAcceptedReservations([]); // Set empty array on error
    }
  };

  const fetchPaymentStatus = async (reservationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/payments/reservation/${reservationId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment status");
      }

      const { data } = await response.json();
      setPayments((prevPayments) => ({
        ...prevPayments,
        [reservationId]: data,
      }));
    } catch (error) {
      console.error(
        `Error fetching payment status for reservation ${reservationId}:`,
        error
      );
    }
  };

  const handlePayment = async (reservationId, paymentMethod) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const reservation = acceptedReservations.find(
        (res) => res.reservation_id === reservationId
      );

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      const paymentData = {
        reservation_id: reservationId,
        payment_method: paymentMethod,
        customer_name: reservation.name,
        amount: reservation.total_amount,
        notes: `Payment for reservation #${reservationId}`,
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment");
      }

      setSuccessMessage("Payment initiated successfully!");
      await fetchAcceptedReservations();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message);
    }
  };

  if (isLoading) {
    return <div className="loading-message">Loading payments...</div>;
  }

  const handlePaymentMethodSelect = (reservationId, method) => {
    setSelectedReservation(reservationId);
    setPaymentMethod(method);
    setContactInfo({ facebookAccount: "", mobileNumber: "" });
  };

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateContactInfo = () => {
    if (!contactInfo.facebookAccount.trim()) {
      setError("Please provide your Facebook account");
      return false;
    }
    if (!contactInfo.mobileNumber.trim()) {
      setError("Please provide your mobile number");
      return false;
    }
    // Basic Philippine mobile number validation
    if (
      !/^(09|\+639)\d{9}$/.test(contactInfo.mobileNumber.replace(/\s/g, ""))
    ) {
      setError("Please enter a valid Philippine mobile number");
      return false;
    }
    return true;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  const handleGCashSubmit = async (reservationId) => {
    try {
      if (!validateContactInfo()) {
        return;
      }

      if (!paymentProof) {
        setError("Please upload your payment screenshot");
        return;
      }

      const formData = new FormData();
      formData.append("payment_proof", paymentProof);
      formData.append("reservation_id", reservationId);
      formData.append("payment_method", "GCash");
      formData.append("facebook_account", contactInfo.facebookAccount);
      formData.append("mobile_number", contactInfo.mobileNumber);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/payments/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload payment proof");
      }

      setSuccessMessage("Payment proof uploaded successfully!");
      setPaymentMethod(null);
      setSelectedReservation(null);
      setPaymentProof(null);
      setContactInfo({ facebookAccount: "", mobileNumber: "" });
      await fetchAcceptedReservations();
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message);
    }
  };

  const handleCashPayment = async (reservationId) => {
    try {
      if (!validateContactInfo()) {
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch("/api/payments/cash-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          facebook_account: contactInfo.facebookAccount,
          mobile_number: contactInfo.mobileNumber,
          payment_method: "Cash",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit cash payment information");
      }

      setSuccessMessage(
        "Cash payment information submitted successfully! The owner will contact you shortly."
      );
      setPaymentMethod(null);
      setSelectedReservation(null);
      setContactInfo({ facebookAccount: "", mobileNumber: "" });
      await fetchAcceptedReservations();
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message);
    }
  };

  return (
    <div className="payments-container">
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
                    <span className="reservation-date">
                      {new Date(
                        reservation.reservation_date
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="reservation-details">
                    <p>
                      <span className="label">Venue:</span> {reservation.venue}
                    </p>
                    <p>
                      <span className="label">Number of Pax:</span>{" "}
                      {reservation.numberOfPax}
                    </p>
                    <p>
                      <span className="label">Amount Due:</span> ₱
                      {reservation.total_amount?.toLocaleString()}
                    </p>
                  </div>

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
                          If you prefer to pay with cash, kindly provide your
                          mobile number so that you and the owner can schedule a
                          time for the payment to be processed.
                        </p>
                        <p>
                          It is required that at least half of the reservation's
                          total cost be paid in advance.
                        </p>
                        <p className="contact-numbers">
                          Kindly give the following mobile numbers a call:
                          <br />
                          09358276798 / 09207129412
                        </p>
                        <button
                          className="close-button"
                          onClick={() => {
                            setPaymentMethod(null);
                            setSelectedReservation(null);
                          }}
                        >
                          Close
                        </button>
                      </div>
                    )}

                  {paymentMethod === "GCash" &&
                    selectedReservation === reservation.reservation_id && (
                      <div className="payment-instructions gcash">
                        <h4>GCash Payment Instructions</h4>
                        <p>
                          If you prefer to pay with GCash, kindly provide a
                          screenshot of your payment. In order to avoid having
                          your reservation rejected, you must pay at least half
                          of the total amount in advance.
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
