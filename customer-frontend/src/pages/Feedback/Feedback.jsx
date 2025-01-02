import React, { useState } from "react";
import "./Feedback.css";

const Feedback = () => {
  const [formData, setFormData] = useState({
    message: "",
    rating: 5,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ message: "", rating: 5 });
      } else {
        const data = await response.json();
        setError(data.message || "Failed to submit feedback");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        {submitted ? (
          <div className="feedback-success">
            <h2>Thank You!</h2>
            <p>Your feedback has been submitted successfully.</p>
            <button onClick={() => setSubmitted(false)}>
              Submit Another Feedback
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <h2>Share Your Experience</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="rating">Rating</label>
              <div className="rating-select">
                {[5, 4, 3, 2, 1].map((num) => (
                  <label key={num} className="rating-label">
                    <input
                      type="radio"
                      name="rating"
                      value={num}
                      checked={Number(formData.rating) === num}
                      onChange={handleChange}
                    />
                    <span className="star">{"⭐".repeat(num)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Your Feedback</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Tell us about your experience..."
              />
            </div>

            <button type="submit" className="submit-button">
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Feedback;
