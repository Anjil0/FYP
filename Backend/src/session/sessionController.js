const express = require("express");
const Booking = require("../booking/bookingModel");
const timeSlotModel = require("../timeSlots/timeSlotModel");
const createError = require("http-errors");

const upcomingSessions = async (req, res, next) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return next(createError(401, "Unauthorized access."));
    }

    const session = await Booking.findOne({
      $or: [{ studentId: userId }, { tutorId: userId }],
      status: "ongoing",
      teachingMode: "online",
    }).populate("timeSlotId");

    if (!session) {
      return next(createError(404, "No upcoming sessions found."));
    }

    const timeSlot = await timeSlotModel.findById(session.timeSlotId);
    if (!timeSlot) {
      return next(createError(404, "Time slot not found."));
    }

    const specificSlot = timeSlot.timeSlots.find(
      (slot) => slot._id.toString() === session.specificTimeSlotId.toString()
    );

    if (!specificSlot) {
      return next(createError(404, "Specific time slot not found."));
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        timeSlotDetails: specificSlot,
        bookName: session.timeSlotId.subjectName,
      },
    });
  } catch (error) {
    console.error("Upcoming Sessions Error:", error);
    next(createError(500, "Server error while fetching upcoming sessions."));
  }
};

module.exports = { upcomingSessions };
