import Feedback from "../models/Feedback.js";

//Create Feedback
export const createFeedback = async (req, res) => {
  try {
    // Extract userId from req.user based on how it's structured in your token
    const userId = req.user.id || req.user.userId || req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const feedback = new Feedback({
      message: req.body.message,
      rating: req.body.rating,
      userId: userId,
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

//Admin reply to feedback
export const replyToFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        adminReply: {
          message,
          repliedAt: Date.now(),
          repliedBy: req.user._id,
        },
        status: "addressed",
      },
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
