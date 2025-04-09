import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FeedbackManagement.css";

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
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
        console.log("Fetched feedback data:", data);
        setFeedbacks(data);

        // Initialize reply text state for each feedback
        const initialReplyState = {};
        data.forEach((feedback) => {
          initialReplyState[feedback._id] = feedback.adminReply?.message || "";
        });
        setReplyText(initialReplyState);
        setError(null);
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
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      setError(`Error connecting to server: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleReplyChange = (id, value) => {
    setReplyText((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmitReply = async (id) => {
    if (!replyText[id]?.trim()) {
      setError("Reply cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:4000/api/feedback/${id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: replyText[id] }),
        }
      );

      if (response.ok) {
        const updatedFeedback = await response.json();
        console.log("Reply submitted successfully:", updatedFeedback);

        // Update the feedbacks state with the new reply data
        setFeedbacks((prevFeedbacks) =>
          prevFeedbacks.map((feedback) =>
            feedback._id === id ? updatedFeedback : feedback
          )
        );
        setError(null);

        // Clear the reply text input after successful submission
        setReplyText((prev) => ({
          ...prev,
          [id]: "",
        }));
      } else if (response.status === 403) {
        setError("You don't have permission to reply to feedback.");
      } else {
        const errorData = await response.json();
        setError(
          `Failed to submit reply: ${errorData.message || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      setError(`Error connecting to server: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchFeedbacks();
  };

  const filteredFeedbacks =
    filterStatus === "all"
      ? feedbacks
      : feedbacks.filter((feedback) => feedback.status === filterStatus);

  if (loading && feedbacks.length === 0)
    return <div className="loading">Loading...</div>;

  if (error && feedbacks.length === 0) {
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
    <div className="feedback-management-container">
      <h1>Feedback Management</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-controls">
        <label>
          Filter by status:
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="addressed">Addressed</option>
          </select>
        </label>
        <button onClick={fetchFeedbacks} className="refresh-button">
          Refresh
        </button>
      </div>

      {loading && <div className="loading-overlay">Updating...</div>}

      {filteredFeedbacks.length === 0 ? (
        <div className="no-feedback">No feedback available.</div>
      ) : (
        <div className="feedback-list">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback._id} className="feedback-item">
              <div className="feedback-header">
                <div className="feedback-user">
                  <strong>User:</strong> {feedback.userId?.name || "Unknown"} (
                  {feedback.userId?.email || "No email"})
                </div>
                <div className="feedback-rating">
                  Rating: {"⭐".repeat(feedback.rating)}
                </div>
                <div className="feedback-date">
                  Submitted: {new Date(feedback.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="feedback-content">
                <p>{feedback.message}</p>
              </div>

              <div className="feedback-controls">
                <div className="status-control">
                  <label>Status:</label>
                  <select
                    value={feedback.status}
                    onChange={(e) =>
                      handleStatusChange(feedback._id, e.target.value)
                    }
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="addressed">Addressed</option>
                  </select>
                </div>
              </div>

              <div className="reply-section">
                <h4>Admin Reply</h4>
                {feedback.adminReply && feedback.adminReply.message ? (
                  <div className="existing-reply">
                    <p>{feedback.adminReply.message}</p>
                    <p className="reply-date">
                      Replied on:{" "}
                      {new Date(feedback.adminReply.repliedAt).toLocaleString()}
                    </p>
                    <button
                      onClick={() =>
                        handleReplyChange(
                          feedback._id,
                          feedback.adminReply.message
                        )
                      }
                      className="edit-reply-button"
                    >
                      Edit Reply
                    </button>
                  </div>
                ) : (
                  <div className="new-reply">
                    <textarea
                      value={replyText[feedback._id] || ""}
                      onChange={(e) =>
                        handleReplyChange(feedback._id, e.target.value)
                      }
                      placeholder="Write your reply here..."
                      disabled={loading}
                      rows={3}
                    />
                    <button
                      onClick={() => handleSubmitReply(feedback._id)}
                      disabled={loading || !replyText[feedback._id]?.trim()}
                      className="submit-reply-button"
                    >
                      Submit Reply
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
