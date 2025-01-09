import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FeedbackManagement.css";

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:4000/api/feedback/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setFeedbacks(data);
        } else {
          console.error("Failed to fetch feedbacks:", response.statusText);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setFeedbacks((prevFeedbacks) =>
          prevFeedbacks.map((feedback) =>
            feedback._id === id ? { ...feedback, status } : feedback
          )
        );
      } else {
        console.error("Failed to update feedback status:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating feedback status:", error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="feedback-management">
      <header className="feedback-header">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="back-button"
        >
          Back to Dashboard
        </button>
        <h1>Customer Feedback Management</h1>
      </header>

      <div className="feedback-grid">
        {feedbacks.map((feedback) => (
          <div key={feedback._id} className="feedback-card">
            <div className="feedback-content">
              <h3>{feedback.userId.name}</h3>
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
                  handleStatusChange(feedback._id, e.target.value)
                }
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
