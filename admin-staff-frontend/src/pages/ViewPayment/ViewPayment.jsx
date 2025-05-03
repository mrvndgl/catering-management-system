import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewPayment.css";
import { X, FileText } from "lucide-react";
import Swal from "sweetalert2";

// Payment details modal component
const PaymentDetailsModal = ({
  payment,
  onClose,
  getStatusClass,
  onStatusUpdate,
  onGenerateReceipt,
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  if (!payment) return null;

  const handleUpdateClick = () => {
    setUpdatingStatus(true);
  };

  const handleStatusSubmit = () => {
    if (selectedStatus) {
      onStatusUpdate(payment.payment_id, selectedStatus);
      setUpdatingStatus(false);
    }
  };

  const renderStatusUpdateOptions = () => {
    // Determine which status options to show based on current status
    if (payment.payment_status === "Pending") {
      return (
        <>
          <select
            className="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Select status</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Downpayment">Downpayment</option>
            <option value="Failed">Failed</option>
          </select>
          <div className="status-update-actions">
            <button
              className="update-status-btn"
              onClick={handleStatusSubmit}
              disabled={!selectedStatus}
            >
              Update
            </button>
            <button
              className="cancel-update-btn"
              onClick={() => setUpdatingStatus(false)}
            >
              Cancel
            </button>
          </div>
        </>
      );
    } else if (
      payment.payment_status === "Fully Paid" ||
      payment.payment_status === "Downpayment"
    ) {
      return (
        <>
          <select
            className="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Select status</option>
            <option value="Completed">Completed</option>
            {payment.payment_status === "Downpayment" && (
              <option value="Fully Paid">Fully Paid</option>
            )}
            <option value="Refunded">Refunded</option>
          </select>
          <div className="status-update-actions">
            <button
              className="update-status-btn"
              onClick={handleStatusSubmit}
              disabled={!selectedStatus}
            >
              Confirm Update
            </button>
            <button
              className="cancel-update-btn"
              onClick={() => setUpdatingStatus(false)}
            >
              Cancel
            </button>
          </div>
        </>
      );
    }
    return null;
  };

  // Determine if receipt can be generated
  const canGenerateReceipt =
    payment.payment_status === "Fully Paid" ||
    payment.payment_status === "Downpayment" ||
    payment.payment_status === "Completed";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payment #{payment.payment_id} Details</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h3>Customer Information</h3>
            <div className="detail-row">
              <span className="detail-label">Customer Name:</span>
              <span className="detail-value">{payment.customerName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Contact Number:</span>
              <span className="detail-value">{payment.phoneNumber}</span>
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
          {!updatingStatus &&
            (payment.payment_status === "Pending" ||
              payment.payment_status === "Fully Paid" ||
              payment.payment_status === "Downpayment") && (
              <button
                className="update-payment-btn"
                onClick={handleUpdateClick}
              >
                Update Payment Status
              </button>
            )}

          {updatingStatus && renderStatusUpdateOptions()}
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
      <img
        src={`${import.meta.env.VITE_API_URL}/payments/proof/${
          payment.payment_proof
        }`}
        alt="Payment proof"
        className="proof-image"
        onError={(e) => {
          console.error("Image load error:", e);
          e.target.src = "/placeholder-image.png";
        }}
      />
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

  const handlePaymentStatusUpdate = async (paymentId, newStatus) => {
    try {
      const result = await Swal.fire({
        title: "Confirm Payment Update",
        text: `Are you sure you want to update this payment status to "${newStatus}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, update it!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) {
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/payments/admin/payments/${paymentId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payment_status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }

      // Update local state
      setPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.payment_id === paymentId
            ? { ...payment, payment_status: newStatus }
            : payment
        )
      );

      // Update the selected payment details if open
      if (
        selectedPaymentDetails &&
        selectedPaymentDetails.payment_id === paymentId
      ) {
        setSelectedPaymentDetails({
          ...selectedPaymentDetails,
          payment_status: newStatus,
        });
      }

      Swal.fire({
        title: "Success!",
        text: `Payment has been updated to "${newStatus}"`,
        icon: "success",
        confirmButtonColor: "#28a745",
      });

      // Refresh payments list
      await fetchPayments();
    } catch (error) {
      console.error("Error updating payment status:", error);
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to update payment status",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token missing");
      }

      console.log("Fetching payments from API...");
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/admin/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const result = await response.json();
      if (result.success) {
        // Fetch customer details for each payment
        const paymentsWithCustomers = await Promise.all(
          result.data.map(async (payment) => {
            try {
              const customerResponse = await fetch(
                `${import.meta.env.VITE_API_URL}/customers/${
                  payment.customer_id
                }`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (customerResponse.ok) {
                const customerData = await customerResponse.json();
                return {
                  ...payment,
                  customerName: `${customerData.data.firstName} ${customerData.data.lastName}`,
                  phoneNumber:
                    payment.phoneNumber || customerData.data.phoneNumber,
                };
              }
              return payment;
            } catch (error) {
              console.error(
                `Error fetching customer for payment ${payment.payment_id}:`,
                error
              );
              return payment;
            }
          })
        );

        const latestPayments = paymentsWithCustomers.reduce((acc, payment) => {
          try {
            const paymentWithDetails = {
              ...payment,
              customerName: payment.customerName || "N/A",
              phoneNumber: payment.phoneNumber || "No contact number",
            };

            const priorityOrder = {
              Completed: 1,
              "Fully Paid": 2,
              Downpayment: 3,
              Pending: 4,
              Failed: 5,
              Refunded: 6,
              Cancelled: 7,
            };

            const existingPayment = acc[payment.reservation_id];
            const existingPriority = existingPayment
              ? priorityOrder[existingPayment.payment_status] || 999
              : 999;
            const newPriority = priorityOrder[payment.payment_status] || 999;

            if (!existingPayment || newPriority < existingPriority) {
              acc[payment.reservation_id] = paymentWithDetails;
            }
            return acc;
          } catch (err) {
            console.error("Error processing payment", payment, err);
            return acc;
          }
        }, {});

        console.log(
          "Processed payments with customer details:",
          latestPayments
        );
        setPayments(Object.values(latestPayments));
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "status-pending";
      case "Fully Paid":
        return "status-paid";
      case "Downpayment":
        return "status-partial";
      case "Completed":
        return "status-completed";
      case "Failed":
        return "status-failed";
      case "Refunded":
        return "status-refunded";
      case "Cancelled":
        return "status-cancelled";
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
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Downpayment">Downpayment</option>
          <option value="Fully Paid">Fully Paid</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
          <option value="Cancelled">Cancelled</option>
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
                  <p className="payment-subtitle">{payment.customerName}</p>
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
                    <span className="info-label">Contact:</span>
                    <span>{payment.phoneNumber}</span>
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
                          src={`${
                            import.meta.env.VITE_API_URL
                          }/payments/proof/${payment.payment_proof}`}
                          alt="Payment proof thumbnail"
                          className="payment-proof-image"
                          onError={(e) => {
                            console.error("Image load error:", e);
                            e.target.src = "/placeholder-image.png";
                          }}
                          onClick={() =>
                            setExpandedImage(
                              `${import.meta.env.VITE_API_URL}/payments/proof/${
                                payment.payment_proof
                              }`
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
          onStatusUpdate={handlePaymentStatusUpdate}
        />
      )}

      {/* Image viewer modal */}
      {expandedImage && (
        <div className="image-viewer-overlay" onClick={handleCloseImage}>
          <div
            className="image-viewer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-button" onClick={handleCloseImage}>
              <X size={24} />
            </button>
            <img
              src={expandedImage}
              alt="Payment proof"
              className="proof-image-large"
              onError={(e) => {
                console.error("Image load error:", e);
                e.target.src = "/placeholder-image.png";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPayment;
