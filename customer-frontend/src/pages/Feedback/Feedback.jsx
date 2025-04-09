import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./Feedback.css";

const Feedback = () => {
  const [formData, setFormData] = useState({
    message: "",
    rating: 5,
  });
  const [error, setError] = useState("");
  const [userFeedback, setUserFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("submit");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      setError("Please log in to submit feedback");
      setLoading(false);
      setIsLoggedIn(false);
      return;
    }

    setIsLoggedIn(true);
    // Only fetch feedback if we're logged in
    fetchUserFeedback();
  }, []);

  const fetchUserFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("Fetching user feedback...");
      const response = await fetch(
        "http://localhost:4000/api/feedback/my-feedback",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          // Add cache-control to prevent browser caching
          cache: "no-cache",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Feedback data received:", data);
        setUserFeedback(data);
      } else if (response.status === 401) {
        console.error("Authentication error:", response.statusText);
        setError("Your session has expired. Please log in again.");
        setIsLoggedIn(false);
      } else {
        console.error("API error:", response.statusText);
        setError(`Failed to fetch your feedback: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user feedback:", error);
      setError(`Error connecting to server: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to submit feedback");
        return;
      }

      const response = await fetch("http://localhost:4000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: formData.message,
          rating: parseInt(formData.rating),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit feedback");
      }

      Swal.fire({
        title: "Thank You!",
        text: "Your feedback has been submitted successfully.",
        icon: "success",
        confirmButtonColor: "#28a745",
      });

      setFormData({ message: "", rating: 5 });

      // Refresh feedback and switch tabs
      await fetchUserFeedback();
      setActiveTab("history"); // Switch to history tab after submission
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message || "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Feedback submission error:", error);
    }
  };

  const handleRefresh = () => {
    fetchUserFeedback();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "addressed":
        return "status-badge addressed";
      case "reviewed":
        return "status-badge reviewed";
      default:
        return "status-badge pending";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "addressed":
        return "Addressed";
      case "reviewed":
        return "Reviewed";
      default:
        return "Pending";
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="feedback-error">Please log in to submit feedback</div>
    );
  }

  return (
    <div className="feedback-main-container">
      {/* Tab Navigation */}
      <div className="feedback-tabs">
        <div
          className={`tab ${activeTab === "submit" ? "active" : ""}`}
          onClick={() => setActiveTab("submit")}
        >
          Submit Feedback
        </div>
        <div
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("history");
            fetchUserFeedback(); // Refresh when switching to history tab
          }}
        >
          Feedback History
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "submit" ? (
        <div className="feedback-container">
          <form onSubmit={handleSubmit} className="feedback-form">
            {error && <div className="feedback-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="rating">Rating</label>
              <select
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="submit-button">
              Submit
            </button>
          </form>
        </div>
      ) : (
        <div className="feedback-history-container">
          <div className="feedback-history-header">
            <button onClick={handleRefresh} className="refresh-button">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading your feedback...</div>
          ) : error ? (
            <div className="feedback-error">
              <p>{error}</p>
              <button onClick={handleRefresh} className="retry-button">
                Retry
              </button>
            </div>
          ) : userFeedback.length === 0 ? (
            <div className="no-feedback">
              You haven't submitted any feedback yet.
            </div>
          ) : (
            <div className="feedback-history">
              {userFeedback.map((feedback) => (
                <div key={feedback._id} className="feedback-history-item">
                  <div className="feedback-header">
                    <div className="feedback-rating">
                      {"⭐".repeat(feedback.rating)}
                    </div>
                    <div className={getStatusBadgeClass(feedback.status)}>
                      {getStatusText(feedback.status)}
                    </div>
                  </div>

                  <div className="feedback-body">
                    <p className="feedback-message">{feedback.message}</p>
                    <p className="feedback-date">
                      Submitted on:{" "}
                      {new Date(feedback.createdAt).toLocaleDateString()} at{" "}
                      {new Date(feedback.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {feedback.adminReply && feedback.adminReply.message ? (
                    <div className="admin-response">
                      <h4>Response from Admin:</h4>
                      <p>{feedback.adminReply.message}</p>
                      {feedback.adminReply.repliedAt && (
                        <p className="admin-reply-date">
                          Replied on:{" "}
                          {new Date(
                            feedback.adminReply.repliedAt
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            feedback.adminReply.repliedAt
                          ).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  ) : feedback.status === "addressed" ? (
                    <div className="admin-response pending">
                      <p>An admin has addressed your feedback.</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Feedback;
