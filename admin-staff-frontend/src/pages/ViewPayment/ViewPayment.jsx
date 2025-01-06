import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import "./ViewPayment.css";

const ViewPayment = () => {
  const navigate = useNavigate(); // Add this hook
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleReturn = () => {
    navigate("/admin/dashboard");
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payments/admin/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const result = await response.json();
      if (result.success) {
        setPayments(result.data);
      } else {
        throw new Error(result.message);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_status: newStatus,
          notes: `Payment ${newStatus.toLowerCase()} by admin`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }

      // Refresh payments list
      await fetchPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      setError(error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "pending";
      case "Paid":
        return "paid";
      case "Failed":
        return "failed";
      case "Refunded":
        return "refunded";
      default:
        return "";
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === "all") return true;
    return payment.payment_status === filterStatus;
  });

  if (isLoading) {
    return <div className="loading-message">Loading payments...</div>;
  }

  return (
    <div className="admin-payments-container">
      <div className="header-section">
        <button className="return-button" onClick={handleReturn}>
          Return to Dashboard
        </button>
      </div>

      <div className="admin-payments-header">
        <h1>Payment Management</h1>
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Payments</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="payments-grid">
        {filteredPayments.map((payment) => (
          <div key={payment.payment_id} className="payment-card">
            <div className="payment-header">
              <h3>Payment #{payment.payment_id}</h3>
              <span
                className={`status-badge ${getStatusColor(
                  payment.payment_status
                )}`}
              >
                {payment.payment_status}
              </span>
            </div>

            <div className="payment-info">
              <p>
                <strong>Reservation:</strong> #{payment.reservation_id}
              </p>
              <p>
                <strong>Customer:</strong> {payment.customer_name}
              </p>
              <p>
                <strong>Amount:</strong> ₱{payment.amount?.toLocaleString()}
              </p>
              <p>
                <strong>Method:</strong> {payment.payment_method}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(payment.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="payment-actions">
              <button
                className="view-button"
                onClick={() => handleViewDetails(payment)}
              >
                View Details
              </button>

              {payment.payment_status === "Pending" && (
                <div className="verification-buttons">
                  <button
                    className="verify-button"
                    onClick={() =>
                      handleUpdatePaymentStatus(payment.payment_id, "Paid")
                    }
                  >
                    Mark as Paid
                  </button>
                  <button
                    className="reject-button"
                    onClick={() =>
                      handleUpdatePaymentStatus(payment.payment_id, "Failed")
                    }
                  >
                    Mark as Failed
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedPayment && (
        <div className="payment-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Payment Details</h2>
              <button
                className="close-button"
                onClick={() => setSelectedPayment(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <strong>Payment ID:</strong>
                <span>#{selectedPayment.payment_id}</span>
              </div>
              <div className="detail-row">
                <strong>Reservation ID:</strong>
                <span>#{selectedPayment.reservation_id}</span>
              </div>
              <div className="detail-row">
                <strong>Customer Name:</strong>
                <span>{selectedPayment.customer_name}</span>
              </div>
              <div className="detail-row">
                <strong>Customer ID:</strong>
                <span>{selectedPayment.customer_id}</span>
              </div>
              <div className="detail-row">
                <strong>Payment Method:</strong>
                <span>{selectedPayment.payment_method}</span>
              </div>
              <div className="detail-row">
                <strong>Amount:</strong>
                <span>₱{selectedPayment.amount?.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span
                  className={`status-text ${getStatusColor(
                    selectedPayment.payment_status
                  )}`}
                >
                  {selectedPayment.payment_status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Created:</strong>
                <span>
                  {new Date(selectedPayment.created_at).toLocaleString()}
                </span>
              </div>
              {selectedPayment.payment_date && (
                <div className="detail-row">
                  <strong>Payment Date:</strong>
                  <span>
                    {new Date(selectedPayment.payment_date).toLocaleString()}
                  </span>
                </div>
              )}
              {selectedPayment.notes && (
                <div className="detail-row">
                  <strong>Notes:</strong>
                  <span>{selectedPayment.notes}</span>
                </div>
              )}

              {selectedPayment.payment_proof && (
                <div className="payment-proof">
                  <h3>Payment Proof</h3>
                  <img
                    src={selectedPayment.payment_proof}
                    alt="Payment Proof"
                    className="proof-image"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPayment;
