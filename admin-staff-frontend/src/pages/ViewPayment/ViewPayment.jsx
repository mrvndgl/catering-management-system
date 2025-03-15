import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewPayment.css";

// Payment details modal component
const PaymentDetailsModal = ({ payment, onClose, getStatusClass }) => {
  if (!payment) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payment #{payment.payment_id} Details</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h3>Customer Information</h3>
            <div className="detail-row">
              <span className="detail-label">Customer Name:</span>
              <span className="detail-value">{payment.customer_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Contact Number:</span>
              <span className="detail-value">{payment.phone_number}</span>
            </div>
          </div>

          <div className="modal-section">
            <h3>Payment Information</h3>
            <div className="detail-row">
              <span className="detail-label">Reservation ID:</span>
              <span className="detail-value">#{payment.reservation_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">{payment.payment_method}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount:</span>
              <span className="detail-value highlight">
                ₱{payment.amount?.toLocaleString()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span
                className={`detail-value status-badge ${getStatusClass(
                  payment.payment_status
                )}`}
              >
                {payment.payment_status}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Transaction Date:</span>
              <span className="detail-value">
                {new Date(payment.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {payment.notes && (
            <div className="modal-section">
              <h3>Additional Notes</h3>
              <div className="notes-box">{payment.notes}</div>
            </div>
          )}

          {payment.payment_proof && (
            <div className="modal-section">
              <h3>Payment Proof</h3>
              <div className="proof-container">
                <img
                  src={`/api/payments/proof/${payment.payment_proof}`}
                  alt="Payment proof"
                  className="proof-image"
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Image viewer modal component
const ImageViewer = ({ imageUrl, onClose }) => (
  <div className="image-viewer-overlay" onClick={onClose}>
    <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <img src={imageUrl} alt="Payment proof" />
    </div>
  </div>
);

const ViewPayment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedImage, setExpandedImage] = useState(null);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

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
        const latestPayments = result.data.reduce((acc, payment) => {
          if (
            !acc[payment.reservation_id] ||
            (payment.payment_status === "Paid" &&
              acc[payment.reservation_id].payment_status !== "Paid")
          ) {
            acc[payment.reservation_id] = payment;
          }
          return acc;
        }, {});
        setPayments(Object.values(latestPayments));
      }
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "status-pending";
      case "Paid":
        return "status-paid";
      case "Failed":
        return "status-failed";
      case "Refunded":
        return "status-refunded";
      default:
        return "";
    }
  };

  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setExpandedImage(null);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchPayments}>
          Retry
        </button>
      </div>
    );
  }

  const filteredPayments =
    filterStatus === "all"
      ? payments
      : payments.filter((payment) => payment.payment_status === filterStatus);

  return (
    <div className="page">
      <div className="filter-container">
        <label htmlFor="status-filter">Filter by status:</label>
        <select
          id="status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="select"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="no-payments">
          <p>No payments found matching the selected filter.</p>
        </div>
      ) : (
        <div className="payments">
          {filteredPayments.map((payment) => (
            <div key={payment.payment_id} className="payment">
              <div className="payment-header">
                <div>
                  <h3 className="payment-title">
                    Payment #{payment.payment_id}
                  </h3>
                  <p className="payment-subtitle">{payment.customer_name}</p>
                </div>
                <span
                  className={`status ${getStatusClass(payment.payment_status)}`}
                >
                  {payment.payment_status}
                </span>
              </div>
              <div className="payment-content">
                <div className="payment-info">
                  <div className="info-row">
                    <span className="info-label">Reservation ID:</span>
                    <span>#{payment.reservation_id}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Amount:</span>
                    <span>₱{payment.amount?.toLocaleString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Method:</span>
                    <span>{payment.payment_method}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date:</span>
                    <span>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {payment.notes && (
                    <div className="payment-notes">
                      <p>
                        {payment.notes.length > 50
                          ? payment.notes.substring(0, 50) + "..."
                          : payment.notes}
                      </p>
                    </div>
                  )}
                  {payment.payment_proof && (
                    <div className="payment-proof">
                      <div className="proof-preview">
                        <img
                          src={`/api/payments/proof/${payment.payment_proof}`}
                          alt="Payment proof thumbnail"
                          onClick={() =>
                            setExpandedImage(
                              `/api/payments/proof/${payment.payment_proof}`
                            )
                          }
                        />
                        <button
                          className="view-proof-button"
                          onClick={() =>
                            setExpandedImage(
                              `/api/payments/proof/${payment.payment_proof}`
                            )
                          }
                        >
                          View Proof
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="payment-actions">
                    <button
                      className="view-details-button"
                      onClick={() => setSelectedPaymentDetails(payment)}
                    >
                      View Complete Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal renders conditionally based on selectedPaymentDetails state */}
      {selectedPaymentDetails && (
        <PaymentDetailsModal
          payment={selectedPaymentDetails}
          onClose={() => setSelectedPaymentDetails(null)}
          getStatusClass={getStatusClass}
        />
      )}

      {expandedImage && (
        <div className="expanded-image-overlay" onClick={handleCloseImage}>
          <div className="expanded-image-container">
            <button className="close-image-button" onClick={handleCloseImage}>
              ×
            </button>
            <img src={expandedImage} alt="Expanded Payment Proof" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPayment;
