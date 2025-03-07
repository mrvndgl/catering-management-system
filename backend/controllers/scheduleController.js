import Schedule from "../models/Schedule.js";
import mongoose from "mongoose";

export const createSchedule = async (req, res) => {
  try {
    const { title, events, isPublic } = req.body;

    // Validate input
    if (!title) {
      return res.status(400).json({ message: "Schedule title is required" });
    }

    const newSchedule = new Schedule({
      userId: req.user.id,
      title,
      events: events || [],
      isPublic: isPublic || false,
    });

    const savedSchedule = await newSchedule.save();
    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({
      message: "Error creating schedule",
      error: error.message,
    });
  }
};

export const getUserSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(schedules);
  } catch (error) {
    console.error("Error fetching user schedules:", error);
    res.status(500).json({
      message: "Error retrieving schedules",
      error: error.message,
    });
  }
};

export const getPublicSchedules = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    const publicSchedules = await Schedule.find({
      isPublic: true,
    })
      .select("title userId createdAt events isPublic")
      .populate("userId", "username")
      .skip(skipIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Schedule.countDocuments({ isPublic: true });

    res.json({
      schedules: publicSchedules,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalSchedules: total,
    });
  } catch (error) {
    console.error("Error fetching public schedules:", error);
    res.status(500).json({
      message: "Error retrieving public schedules",
      error: error.message,
    });
  }
};

export const getPublicScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      _id: req.params.scheduleId,
      isPublic: true,
    }).populate("userId", "username");

    if (!schedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found or not public" });
    }

    res.json(schedule);
  } catch (error) {
    console.error("Error fetching schedule details:", error);
    res.status(500).json({
      message: "Error retrieving schedule details",
      error: error.message,
    });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { isPublic, title, events } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (events !== undefined) updateData.events = events;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedSchedule = await Schedule.findOneAndUpdate(
      { _id: req.params.scheduleId, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSchedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found or unauthorized" });
    }

    res.json(updatedSchedule);
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({
      message: "Error updating schedule",
      error: error.message,
    });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const deletedSchedule = await Schedule.findOneAndDelete({
      _id: req.params.scheduleId,
      userId: req.user.id,
    });

    if (!deletedSchedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found or unauthorized" });
    }

    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({
      message: "Error deleting schedule",
      error: error.message,
    });
  }
};

// Utility function for event validation
export const validateScheduleEvents = (events) => {
  if (!Array.isArray(events)) return false;

  return events.every((event) => {
    return (
      event.title &&
      event.start &&
      event.end &&
      new Date(event.start) <= new Date(event.end)
    );
  });
};
