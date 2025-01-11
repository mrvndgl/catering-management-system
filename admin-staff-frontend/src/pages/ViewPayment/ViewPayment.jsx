import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewPayment.css";

const ViewPayment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

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
              acc[payment.reservation_id].payment_status !== "Paid") ||
            payment.created_at > acc[payment.reservation_id].created_at
          ) {
            acc[payment.reservation_id] = payment;
          }
          return acc;
        }, {});

        setPayments(
          Object.values(latestPayments).sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )
        );
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleReturn = () => {
    navigate("/admin/dashboard");
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
        <button onClick={handleReturn} className="button">
          Return to Dashboard
        </button>

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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewPayment;
