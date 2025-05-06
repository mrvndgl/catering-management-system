import Feedback from "../models/Feedback.js";

//Create Feedback
export const createFeedback = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;

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
    // Extract userId consistently using the same approach as createFeedback
    const userId = req.user.userId;

    console.log("Fetching feedback for user ID:", userId);

    const feedback = await Feedback.find({ userId: userId }).sort({
      createdAt: -1,
    });

    console.log("Found feedback items:", feedback.length);
    res.json(feedback);
  } catch (error) {
    console.error("Error in getUserFeedback:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all feedback (admin only)
export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("userId", "firstName lastName username")
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

// Get public feedback for displaying on homepage
export const getPublicFeedback = async (req, res) => {
  try {
    // Fetch feedbacks that have been reviewed and are appropriate for public display
    const publicFeedbacks = await Feedback.find({
      status: { $in: ["reviewed", "addressed"] },
      rating: { $gte: 3 }, // Only show 3+ star ratings on public page
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(20); // Limit to prevent performance issues

    res.json(publicFeedbacks);
  } catch (error) {
    console.error("Error fetching public feedback:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching public feedback" });
  }
};
