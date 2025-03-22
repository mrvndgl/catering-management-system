import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FeedbackManagement.css";

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:4000/api/feedback/all", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFeedbacks(data);
        } else if (response.status === 403) {
          setError(
            "You don't have permission to access feedback data. Please contact an administrator."
          );
          // Optionally redirect to login if token is invalid
          if (response.statusText === "Invalid token") {
            localStorage.removeItem("token");
            navigate("/login");
          }
        } else if (response.status === 401) {
          setError("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError(`Failed to fetch feedbacks: ${response.statusText}`);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
        setError(`Error connecting to server: ${error.message}`);
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [navigate]);

  const handleStatusChange = async (id, status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

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
        setError(null);
      } else if (response.status === 403) {
        setError("You don't have permission to update feedback status.");
      } else {
        setError(`Failed to update feedback status: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating feedback status:", error);
      setError(`Error connecting to server: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Re-trigger the effect by changing a state variable it depends on
    // This works because navigate is in the dependency array
    navigate(window.location.pathname);
  };

  if (loading) return <div className="loading">Loading...</div>;

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-button">
          Retry
        </button>
        <button onClick={() => navigate("/dashboard")} className="back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="feedback-management">
      <h2>Feedback Management</h2>
      {feedbacks.length === 0 ? (
        <div className="no-feedbacks">No feedbacks available.</div>
      ) : (
        <div className="feedback-grid">
          {feedbacks.map((feedback) => (
            <div key={feedback._id} className="feedback-card">
              <div className="feedback-content">
                <h3>{feedback.userId?.name || "Unknown User"}</h3>
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
      )}
    </div>
  );
};

export default FeedbackManagement;
