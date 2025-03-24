import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./Feedback.css";

const Feedback = () => {
  const [formData, setFormData] = useState({
    message: "",
    rating: 5,
    userId: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser)._id : null;

    if (!userId) {
      setError("Please log in to submit feedback");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      userId,
    }));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting feedback with userId:", formData.userId);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: formData.message,
          rating: parseInt(formData.rating),
          userId: formData.userId,
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

      setFormData({ message: "", rating: 5, userId: formData.userId });
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

  if (!formData.userId) {
    return (
      <div className="feedback-error">Please log in to submit feedback</div>
    );
  }

  return (
    <div className="feedback-container">
      <form onSubmit={handleSubmit} className="feedback-form">
        <h2>Feedback</h2>
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
  );
};

export default Feedback;
