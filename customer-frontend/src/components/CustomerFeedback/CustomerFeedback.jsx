import React, { useState, useEffect } from "react";
import "./CustomerFeedback.css";
import feedbackImage from "../../assets/feedback.png"; // Import your feedback.png image

const CustomerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const feedbacksPerPage = 3;

  useEffect(() => {
    // This simulates an API call with static data
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);

        // Try to fetch from API first
        try {
          const response = await fetch(
            "http://localhost:4000/api/feedback/public",
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setFeedbacks(data);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.log("API not available, using static data instead");
        }

        // If API fails, use static data
        const staticFeedbacks = [
          {
            _id: "1",
            rating: 5,
            message:
              "The food was absolutely delicious! Best restaurant experience in months.",
            userId: { name: "John Davis" },
            adminReply: {
              message:
                "Thank you for your kind words! We're delighted you enjoyed your meal.",
              repliedAt: new Date().toISOString(),
            },
          },
          {
            _id: "2",
            rating: 4,
            message:
              "Great service and atmosphere. The pasta was incredible but dessert options could be improved.",
            userId: { name: "Sarah Wilson" },
          },
          {
            _id: "3",
            rating: 5,
            message:
              "Friendly staff and excellent menu options for vegetarians. Will definitely come back!",
            userId: { name: "Michael Chen" },
            adminReply: {
              message:
                "We appreciate your feedback! We take pride in our vegetarian options.",
              repliedAt: new Date().toISOString(),
            },
          },
          {
            _id: "4",
            rating: 5,
            message:
              "The online ordering system was so easy to use and my food arrived hot and fresh.",
            userId: { name: "Emma Thompson" },
          },
          {
            _id: "5",
            rating: 4,
            message:
              "Reasonable prices for the quality you get. Portions are generous!",
            userId: { name: "Robert Johnson" },
          },
        ];

        setFeedbacks(staticFeedbacks);
        setError(null);
      } catch (error) {
        console.error("Error:", error);
        setError("Error loading feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const nextPage = () => {
    if (currentPage < Math.ceil(feedbacks.length / feedbacksPerPage) - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentFeedbacks = feedbacks.slice(
    currentPage * feedbacksPerPage,
    (currentPage + 1) * feedbacksPerPage
  );

  return (
    <div className="customer-feedback-section">
      <div className="feedback-layout">
        {/* Left side - Image */}
        <div className="feedback-image-container">
          <img
            src={feedbackImage}
            alt="Customer Feedback"
            className="feedback-main-image"
          />
        </div>

        {/* Right side - Content */}
        <div className="feedback-content-container">
          <h2>What Our Customers Say</h2>

          {loading && (
            <div className="feedback-loading">Loading feedbacks...</div>
          )}

          {error && (
            <div className="feedback-error">
              <p>Unable to load feedback at this time.</p>
              <p>Please check back later!</p>
            </div>
          )}

          {!loading && !error && feedbacks.length === 0 && (
            <div className="no-feedback">
              <p>Be the first to leave your feedback!</p>
            </div>
          )}

          {!loading && feedbacks.length > 0 && (
            <>
              <div className="feedback-container">
                {currentFeedbacks.map((feedback) => (
                  <div key={feedback._id} className="feedback-card">
                    <div className="feedback-rating">
                      {"⭐".repeat(feedback.rating)}
                    </div>
                    <div className="feedback-message">
                      <p>"{feedback.message}"</p>
                    </div>
                    <div className="feedback-user">
                      - {feedback.userId?.name || "Happy Customer"}
                    </div>
                    {feedback.adminReply && feedback.adminReply.message && (
                      <div className="feedback-reply">
                        <p className="reply-label">Our Response:</p>
                        <p>"{feedback.adminReply.message}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {feedbacks.length > feedbacksPerPage && (
                <div className="feedback-navigation">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="nav-button"
                  >
                    &#8592;
                  </button>
                  <span className="page-indicator">
                    {currentPage + 1} /{" "}
                    {Math.ceil(feedbacks.length / feedbacksPerPage)}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={
                      currentPage >=
                      Math.ceil(feedbacks.length / feedbacksPerPage) - 1
                    }
                    className="nav-button"
                  >
                    &#8594;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerFeedback;
