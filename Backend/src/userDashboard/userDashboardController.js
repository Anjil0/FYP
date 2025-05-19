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

async function getUpcomingSessionsData(studentId) {
  const now = moment();

  // Fetch active ongoing bookings for the student
  const upcomingBookings = await BookingModel.find({
    studentId: new mongoose.Types.ObjectId(studentId),
    status: "ongoing",
    teachingMode: "online",
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
    .sort({ startDate: 1 });

  let allSessions = [];

  for (const booking of upcomingBookings) {
    const timeSlotDetails = booking.timeSlotId.timeSlots.find(
      (slot) => slot._id.toString() === booking.specificTimeSlotId.toString()
    );

    if (!timeSlotDetails) continue;

    const startTime = moment(timeSlotDetails.startTime, "h:mm A");
    const endTime = moment(timeSlotDetails.endTime, "h:mm A");

    // Generate up to 4 future sessions
    const futureSessions = findNextMultipleSessionDates(
      booking.timeSlotId.daysOfWeek,
      startTime,
      endTime,
      4
    );

    futureSessions.forEach((session) => {
      const { sessionStartTime, sessionEndTime } = session;

      if (now.isAfter(sessionEndTime)) return;

      allSessions.push({
        _id: booking._id,
        tutorId: booking.tutorId._id,
        tutorName: booking.tutorId.username,
        tutorImage: booking.tutorId.image,
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookName: booking.timeSlotId.subjectName,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        nextSessionDate: sessionStartTime.format("YYYY-MM-DD"),
        dayName: sessionStartTime.format("dddd"),
        timeSlotDetails: {
          _id: booking.specificTimeSlotId,
          startTime: timeSlotDetails.startTime,
          endTime: timeSlotDetails.endTime,
          nextStartTime: sessionStartTime.format("YYYY-MM-DD HH:mm:ss"),
          nextEndTime: sessionEndTime.format("YYYY-MM-DD HH:mm:ss"),
        },
        yourName: booking.studentId.username,
        anotherPersonName: booking.tutorId.username,
      });
    });
  }

  // Sort by time and limit to 4
  const upcomingSessions = allSessions
    .sort((a, b) =>
      moment(a.timeSlotDetails.nextStartTime).diff(
        moment(b.timeSlotDetails.nextStartTime)
      )
    )
    .slice(0, 4);

  return { sessions: upcomingSessions };
}

function findNextMultipleSessionDates(daysOfWeek, startTime, endTime, count) {
  const now = moment();
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const sessionDays = daysOfWeek.map((day) => weekdays.indexOf(day));
  let futureSessions = [];

  let dayOffset = 0;
  while (futureSessions.length < count && dayOffset < 30) {
    const checkDate = moment().add(dayOffset, "days");
    const checkDay = checkDate.day();

    if (sessionDays.includes(checkDay)) {
      const sessionStartTime = checkDate
        .clone()
        .hour(startTime.hour())
        .minute(startTime.minute())
        .second(0);

      const sessionEndTime = checkDate
        .clone()
        .hour(endTime.hour())
        .minute(endTime.minute())
        .second(0);

      if (sessionEndTime.isAfter(now)) {
        futureSessions.push({ sessionStartTime, sessionEndTime });
      }
    }

    dayOffset++;
  }

  return futureSessions;
}
