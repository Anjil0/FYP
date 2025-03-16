const Booking = require("../booking/bookingModel");
const timeSlotModel = require("../timeSlots/timeSlotModel");
const createError = require("http-errors");
const UserModel = require("../users/userModel");
const tutorModel = require("../tutors/tutorModel");

const upcomingSessions = async (req, res, next) => {
  try {
    const userId = req.user?.sub;

    const session = await Booking.findOne({
      $or: [{ studentId: userId }, { tutorId: userId }],
      status: "ongoing",
      teachingMode: "online",
    }).populate("timeSlotId");

    if (!session) {
      return next(createError(400, "No upcoming sessions found."));
    }

    const studentDetails = await UserModel.findById(session.studentId);
    if (!studentDetails) {
      return next(createError(400, "Student details not found."));
    }

    const tutorDetails = await tutorModel.findById(session.tutorId);
    if (!tutorDetails) {
      return next(createError(400, "Tutor details not found."));
    }

    const timeSlot = await timeSlotModel.findById(session.timeSlotId);
    if (!timeSlot) {
      return next(createError(400, "Time slot not found."));
    }

    const specificSlot = timeSlot.timeSlots.find(
      (slot) => slot._id.toString() === session.specificTimeSlotId.toString()
    );

    if (!specificSlot) {
      return next(createError(400, "Specific time slot not found."));
    }

    // Determine if the current user is the student or tutor
    const isStudent = session.studentId.toString() === userId;
    
    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        yourName: isStudent ? studentDetails.username : tutorDetails.username,
        anotherPersonName: isStudent ? tutorDetails.username : studentDetails.username,
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
