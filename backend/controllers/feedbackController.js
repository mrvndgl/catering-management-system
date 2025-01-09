import Feedback from "../models/Feedback.js";

// Create feedback
export const createFeedback = async (req, res) => {
  try {
    const feedback = new Feedback({
      message: req.body.message,
      rating: req.body.rating,
      userId: req.body.userId,
    });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    console.error("Feedback creation error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get user's feedback
export const getUserFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all feedback (admin only)
export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update feedback status (admin only)
export const updateFeedbackStatus = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.json(feedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
