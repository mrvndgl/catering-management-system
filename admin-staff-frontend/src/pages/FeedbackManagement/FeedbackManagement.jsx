import React, { useState, useEffect } from "react";
import "./FeedbackManagement.css";

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch("/api/feedback");
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchFeedbacks();
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="feedback-management">
      <header className="feedback-header">
        <h1>Customer Feedback Management</h1>
      </header>

      <div className="feedback-grid">
        {feedbacks.map((feedback) => (
          <div key={feedback._id} className="feedback-card">
            <div className="feedback-content">
              <h3>{feedback.customerName}</h3>
              <p className="feedback-text">{feedback.message}</p>
              <div className="feedback-meta">
                <span>Rating: {"⭐".repeat(feedback.rating)}</span>
                <span>
                  Date: {new Date(feedback.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="feedback-actions">
              <select
                value={feedback.status}
                onChange={(e) =>
                  handleStatusUpdate(feedback._id, e.target.value)
                }
                className={`status-select ${feedback.status}`}
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="addressed">Addressed</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackManagement;
