const mongoose = require("mongoose");
const UserModel = require("../users/userModel");
const BookingModel = require("../booking/bookingModel");
const TutorModel = require("../tutors/tutorModel");
const TimeSlotModel = require("../timeSlots/timeSlotModel");
const MessageModel = require("../message/messageModel");
const AssignmentModel = require("../assignments/assignmentsModel");
const RatingModel = require("../ratings/ratingModel");
const moment = require("moment-timezone");
/**
 * Get comprehensive dashboard overview data for a student
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const studentId = req.user.sub;
    // Get upcoming sessions
    const upcomingSessions = await getUpcomingSessionsData(studentId);
    // Get recent messages
    const recentMessages = await getRecentMessagesData(studentId);
    // Get my tutors
    const myTutors = await getMyTutorsData(studentId);
    // Get past assignments
    const pastAssignments = await getPastAssignmentsData(studentId);
    // Get analytics
    const analytics = await getAnalyticsData(studentId);
    return res.status(200).json({
      IsSuccess: true,
      Result: {
        upcomingSessions,
        recentMessages,
        myTutors,
        pastAssignments,
        analytics,
      },
      ErrorMessage: "",
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return res.status(500).json({
      IsSuccess: false,
      Result: null,
      ErrorMessage: "Failed to retrieve dashboard data",
    });
  }
};

/**
 * Get upcoming sessions for a student
 */
exports.getUpcomingSessions = async (req, res) => {
  try {
    const studentId = req.user.sub;
    const upcomingSessions = await getUpcomingSessionsData(studentId);
    return res.status(200).json({
      IsSuccess: true,
      Result: upcomingSessions,
      ErrorMessage: "",
    });
  } catch (error) {
    console.error("Upcoming sessions error:", error);
    return res.status(500).json({
      IsSuccess: false,
      Result: null,
      ErrorMessage: "Failed to retrieve upcoming sessions",
    });
  }
};

/**
 * Get recent messages for a student
 */
exports.getRecentMessages = async (req, res) => {
  try {
    const studentId = req.user.sub;
    const recentMessages = await getRecentMessagesData(studentId);
    return res.status(200).json({
      IsSuccess: true,
      Result: recentMessages,
      ErrorMessage: "",
    });
  } catch (error) {
    console.error("Recent messages error:", error);
    return res.status(500).json({
      IsSuccess: false,
      Result: null,
      ErrorMessage: "Failed to retrieve recent messages",
    });
  }
};

/**
 * Get tutors the student has had sessions with
 */
exports.getMyTutors = async (req, res) => {
  try {
    const studentId = req.user.sub;
    const myTutors = await getMyTutorsData(studentId);
    return res.status(200).json({
      IsSuccess: true,
      Result: myTutors,
      ErrorMessage: "",
    });
  } catch (error) {
    console.error("My tutors error:", error);
    return res.status(500).json({
      IsSuccess: false,
      Result: null,
      ErrorMessage: "Failed to retrieve tutors",
    });
  }
};

/**
 * Get past assignments for a student
 */
exports.getPastAssignments = async (req, res) => {
  try {
    const studentId = req.user.sub;
    const pastAssignments = await getPastAssignmentsData(studentId);
    return res.status(200).json({
      IsSuccess: true,
      Result: pastAssignments,
      ErrorMessage: "",
    });
  } catch (error) {
    console.error("Past assignments error:", error);
    return res.status(500).json({
      IsSuccess: false,
      Result: null,
      ErrorMessage: "Failed to retrieve past assignments",
    });
  }
};

/**
 * Get session analytics for a student
 */
exports.getSessionAnalytics = async (req, res) => {
  try {
    const studentId = req.user.sub;
    const analytics = await getAnalyticsData(studentId);
    return res.status(200).json({
      IsSuccess: true,
      Result: analytics,
      ErrorMessage: "",
    });
  } catch (error) {
    console.error("Session analytics error:", error);
    return res.status(500).json({
      IsSuccess: false,
      Result: null,
      ErrorMessage: "Failed to retrieve session analytics",
    });
  }
};

async function getUpcomingSessionsData(studentId) {
  const now = moment();
  const todayWeekday = moment().format("dddd");

  // Fetch active ongoing bookings for the student
  const upcomingBookings = await BookingModel.find({
    studentId: new mongoose.Types.ObjectId(studentId),
    status: "ongoing",
    isActive: true,
  })
    .populate({
      path: "tutorId",
      select: "username image",
    })
    .populate({
      path: "studentId",
      select: "username",
    })
    .populate({
      path: "timeSlotId",
      select: "timeSlots daysOfWeek subjectName fee",
    })
    .sort({ startDate: 1 })
    .limit(5);

  // Filter bookings for today's weekday
  const filteredBookings = upcomingBookings.filter((booking) =>
    booking.timeSlotId.daysOfWeek.includes(todayWeekday)
  );

  // Format data for frontend
  const upcomingSessions = filteredBookings
    .map((booking) => {
      const timeSlotDetails = booking.timeSlotId.timeSlots.find(
        (slot) => slot._id.toString() === booking.specificTimeSlotId.toString()
      );

      if (!timeSlotDetails) return null;

      // Convert stored 12-hour time format to moment.js time
      const sessionStartTime = moment(timeSlotDetails.startTime, "h:mm A");
      const sessionEndTime = moment(timeSlotDetails.endTime, "h:mm A");

      // Exclude if the session's end time has already passed
      if (now.isAfter(sessionEndTime)) return null;

      return {
        _id: booking._id,
        tutorId: booking.tutorId._id,
        tutorName: booking.tutorId.username,
        tutorImage: booking.tutorId.image,
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookName: booking.timeSlotId.subjectName,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        todayWeekday,
        timeSlotDetails: {
          _id: booking.specificTimeSlotId,
          startTime: timeSlotDetails.startTime,
          endTime: timeSlotDetails.endTime,
        },
        yourName: booking.studentId.username,
        anotherPersonName: booking.tutorId.username,
      };
    })
    .filter((session) => session !== null);

  return { sessions: upcomingSessions };
}

async function getRecentMessagesData(studentId) {
  // Get recent messages grouped by booking/tutor
  const recentMessages = await MessageModel.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(studentId) },
          { receiverId: new mongoose.Types.ObjectId(studentId) },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$bookingId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $ne: ["$senderId", new mongoose.Types.ObjectId(studentId)],
                  },
                  { $eq: ["$read", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
    { $limit: 5 },
  ]);
  // Get booking and tutor details
  const messageDetails = await Promise.all(
    recentMessages.map(async (message) => {
      const booking = await BookingModel.findById(message._id).populate({
        path: "tutorId",
        select: "username image",
      });
      if (!booking) return null;
      return {
        bookingId: message._id,
        tutorId: booking.tutorId._id,
        tutorName: booking.tutorId.username,
        tutorImage: booking.tutorId.image,
        lastMessage: message.lastMessage.content,
        timestamp: message.lastMessage.createdAt,
        unreadCount: message.unreadCount,
      };
    })
  );
  return messageDetails.filter((msg) => msg !== null);
}

async function getMyTutorsData(studentId) {
  // Find unique tutors from bookings
  const bookings = await BookingModel.find({
    studentId: studentId,
    status: { $in: ["tutorConfirmed", "ongoing", "completed", "rated"] },
  }).distinct("tutorId");
  // Get tutor details
  const tutors = await TutorModel.find({
    _id: { $in: bookings },
  }).select("username image education description");
  // Get ratings
  const tutorRatings = await RatingModel.aggregate([
    {
      $match: { tutorId: { $in: bookings } },
    },
    {
      $group: {
        _id: "$tutorId",
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);
  // Join tutors with their ratings
  return tutors.map((tutor) => {
    const rating = tutorRatings.find(
      (r) => r._id.toString() === tutor._id.toString()
    );
    return {
      _id: tutor._id,
      name: tutor.username,
      image: tutor.image,
      education: tutor.education,
      description: tutor.description,
      rating: rating ? rating.averageRating : null,
      totalRatings: rating ? rating.totalRatings : 0,
    };
  });
}

async function getPastAssignmentsData(studentId) {
  // Get past assignments
  const assignments = await AssignmentModel.find({
    studentId: studentId,
  })
    .populate({
      path: "tutorId",
      select: "username image",
    })
    .populate({
      path: "bookingId",
      select: "timeSlotId",
    })
    .sort({ dueDate: -1 })
    .limit(5);
  // Format for frontend
  return assignments.map((assignment) => {
    return {
      _id: assignment._id,
      title: assignment.title,
      subject: assignment.subject,
      dueDate: assignment.dueDate,
      status: assignment.status,
      tutorName: assignment.tutorId.username,
      tutorImage: assignment.tutorId.image,
      bookingId: assignment.bookingId._id,
      hasAttachments:
        assignment.attachments && assignment.attachments.length > 0,
      hasSubmission: assignment.submission && assignment.submission.submittedAt,
      grade: assignment.feedback ? assignment.feedback.grade : null,
    };
  });
}

async function getAnalyticsData(studentId) {
  // Get booking statistics
  const totalBookings = await BookingModel.countDocuments({
    studentId: studentId,
  });

  const completedBookings = await BookingModel.countDocuments({
    studentId: studentId,
    status: { $in: ["completed", "rated"] },
  });

  // Calculate total spending
  const bookings = await BookingModel.find({
    studentId: studentId,
    status: { $in: ["completed", "rated"] },
  });

  const totalSpent = bookings.reduce(
    (sum, booking) => sum + booking.totalAmount,
    0
  );

  // Get assignments statistics
  const totalAssignments = await AssignmentModel.countDocuments({
    studentId: studentId,
  });

  const submittedAssignments = await AssignmentModel.countDocuments({
    studentId: studentId,
    status: { $in: ["submitted", "reviewed", "completed"] },
  });

  // Get assignments by status for better tracking
  const assignmentsByStatus = await AssignmentModel.aggregate([
    {
      $match: { studentId: new mongoose.Types.ObjectId(studentId) },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Format assignment status data
  const assignmentStatusData = {};
  assignmentsByStatus.forEach((item) => {
    assignmentStatusData[item._id] = item.count;
  });

  // Get recently completed assignments with grades
  const gradedAssignments = await AssignmentModel.find({
    studentId: studentId,
    status: { $in: ["reviewed", "completed"] },
    "feedback.grade": { $exists: true },
  })
    .sort({ "feedback.providedAt": -1 })
    .limit(5)
    .select("title subject feedback.grade");

  return {
    totalSessions: totalBookings,
    completedSessions: completedBookings,
    totalSpent: totalSpent,
    totalAssignments: totalAssignments,
    submittedAssignments: submittedAssignments,
    assignmentStatusData: assignmentStatusData,
    completionRate:
      totalBookings > 0
        ? Math.round((completedBookings / totalBookings) * 100)
        : 0,
    assignmentCompletionRate:
      totalAssignments > 0
        ? Math.round((submittedAssignments / totalAssignments) * 100)
        : 0,
    recentGradedAssignments: gradedAssignments,
  };
}

// Utility function to convert 24-hour time to 12-hour format
function convertTo12HourFormat(time24) {
  // Parse the 24-hour time
  const [hours24, minutes] = time24.split(":").map((num) => parseInt(num, 10));
  // Determine period (AM/PM)
  const period = hours24 >= 12 ? "PM" : "AM";
  // Convert hours to 12-hour format
  let hours12 = hours24 % 12;
  hours12 = hours12 === 0 ? 12 : hours12; // Convert 0 to 12 for 12 AM
  // Format the time string
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}
