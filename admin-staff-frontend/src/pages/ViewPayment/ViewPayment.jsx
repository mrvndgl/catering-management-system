import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewPayment.css";

const ViewPayment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedImage, setExpandedImage] = useState(null);

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

  // Image viewer modal component
  const ImageViewer = ({ imageUrl, onClose }) => (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div
        className="image-viewer-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <img src={imageUrl} alt="Payment proof" />
      </div>
    </div>
  );

  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setExpandedImage(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="loading">Loading payments...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const filteredPayments =
    filterStatus === "all"
      ? payments
      : payments.filter((payment) => payment.payment_status === filterStatus);

  return (
    <div className="page">
      <div className="header">
        <h1>Manage Payments</h1>
        <select
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

      <div className="payments">
        {filteredPayments.map((payment) => (
          <div key={payment.payment_id} className="payment">
            <div className="payment-header">
              <div>
                <h3 className="payment-title">Payment #{payment.payment_id}</h3>
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
                    <p>{payment.notes}</p>
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
                        View Payment Proof
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {expandedImage && (
        <div className="expanded-image-overlay" onClick={handleCloseImage}>
          <img src={expandedImage} alt="Expanded Payment Proof" />
        </div>
      )}
    </div>
  );
};

export default ViewPayment;
