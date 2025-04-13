const Booking = require("../booking/bookingModel");
const TimeSlotModel = require("../timeSlots/timeSlotModel");
const createError = require("http-errors");
const UserModel = require("../users/userModel");
const TutorModel = require("../tutors/tutorModel");

/**
 * Get all sessions scheduled for today for the current user (student or tutor)
 */
const getTodaySessions = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return next(createError(401, "Unauthorized: User ID is missing"));
    }

    // Get current date and day of week
    const currentDate = new Date();
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = daysOfWeek[currentDate.getDay()];

    // Set time to beginning of day for comparison
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Set time to end of day for comparison
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all bookings where the user is either the student or tutor
    const bookings = await Booking.find({
      $or: [{ studentId: userId }, { tutorId: userId }],
      status: { $in: ["tutorConfirmed", "paymentPending", "ongoing"] },
      isActive: true,

      $or: [

        {
          startDate: { $lte: endOfDay },
          endDate: { $gte: startOfDay },
        },
      ],
    }).populate({
      path: "timeSlotId",
      select: "timeSlots daysOfWeek subjectName timezone",
    });

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        StatusCode: 200,
        IsSuccess: true,
        ErrorMessage: [],
        Result: {
          sessions: [],
        },
      });
    }

    // Filter sessions that are scheduled for today based on the day of week
    const todaySessions = [];

    for (const booking of bookings) {
      // Skip if timeSlotId is not populated correctly
      if (!booking.timeSlotId || !booking.timeSlotId.daysOfWeek) {
        continue;
      }

      // Check if today is in the daysOfWeek array
      if (booking.timeSlotId.daysOfWeek.includes(today)) {
        // Find the specific time slot
        const specificSlot = booking.timeSlotId.timeSlots.find(
          (slot) =>
            slot._id.toString() === booking.specificTimeSlotId.toString()
        );

        if (!specificSlot) {
          continue;
        }

        // Get the student and tutor details
        const [studentDetails, tutorDetails] = await Promise.all([
          UserModel.findById(booking.studentId).select("username image"),
          TutorModel.findById(booking.tutorId).select("username image"),
        ]);

        if (!studentDetails || !tutorDetails) {
          continue;
        }

        // Determine if the current user is the student or tutor
        const isStudent = booking.studentId.toString() === userId;

        // Format the time (assuming time is stored as HH:MM format)
        const startTime = specificSlot.startTime;
        const endTime = specificSlot.endTime;

        todaySessions.push({
          sessionId: booking._id,
          yourName: isStudent ? studentDetails.username : tutorDetails.username,
          yourImage: isStudent ? studentDetails.image : tutorDetails.image,
          anotherPersonName: isStudent
            ? tutorDetails.username
            : studentDetails.username,
          anotherPersonImage: isStudent
            ? tutorDetails.image
            : studentDetails.image,
          role: isStudent ? "student" : "tutor",
          subjectName: booking.timeSlotId.subjectName,
          startTime,
          endTime,
          status: booking.status,
          teachingMode: booking.teachingMode,
          date: currentDate.toISOString().split("T")[0],
        });
      }
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        sessions: todaySessions,
      },
    });
  } catch (error) {
    console.error("Today's Sessions Error:", error);
    next(createError(500, "Server error while fetching today's sessions."));
  }
};

// Keep the original upcomingSessions function
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

    const tutorDetails = await TutorModel.findById(session.tutorId);
    if (!tutorDetails) {
      return next(createError(400, "Tutor details not found."));
    }

    const timeSlot = await TimeSlotModel.findById(session.timeSlotId);
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
        anotherPersonName: isStudent
          ? tutorDetails.username
          : studentDetails.username,
        timeSlotDetails: specificSlot,
        bookName: session.timeSlotId.subjectName,
      },
    });
  } catch (error) {
    console.error("Upcoming Sessions Error:", error);
    next(createError(500, "Server error while fetching upcoming sessions."));
  }
};

module.exports = { upcomingSessions, getTodaySessions };
