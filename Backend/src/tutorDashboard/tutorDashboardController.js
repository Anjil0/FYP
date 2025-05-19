// controllers/tutorDashboardController.js
const tutorModel = require("../tutors/tutorModel");
const bookingModel = require("../booking/bookingModel");
const timeSlotModel = require("../timeSlots/timeSlotModel");
const ratingModel = require("../ratings/ratingModel");
const assignmentModel = require("../assignments/assignmentsModel");
const messageModel = require("../message/messageModel");
const mongoose = require("mongoose");
const moment = require("moment");

// Get tutor dashboard details
exports.getTutorDashboardDetails = async (req, res) => {
  try {
    const tutorId = req.user.sub;

    // Get tutor profile data
    const tutor = await tutorModel.findById(tutorId).select("-password");
    if (!tutor) {
      return res.status(404).json({
        IsSuccess: false,
        Message: "Tutor not found",
      });
    }

    // Get total number of students (unique students from bookings)
    const uniqueStudents = await bookingModel.distinct("studentId", {
      tutorId: tutorId,
    });

    // Get total active sessions
    const activeSessions = await bookingModel.countDocuments({
      tutorId: tutorId,
      status: { $in: ["tutorConfirmed", "ongoing"] },
      isActive: true,
    });

    // Get average rating
    const ratings = await ratingModel.find({ tutorId: tutorId });
    const averageRating =
      ratings.length > 0
        ? (
            ratings.reduce((sum, rating) => sum + rating.rating, 0) /
            ratings.length
          ).toFixed(1)
        : 0;

    // Get total number of reviews
    const totalReviews = ratings.length;

    // Get unread messages count
    const newMessages = await messageModel.countDocuments({
      receiverId: tutorId,
      read: false,
    });

    // Calculate growth rates
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Calculate student growth
    const studentsLastMonth = await bookingModel.distinct("studentId", {
      tutorId: tutorId,
      status: { $in: ["ongoing", "completed", "rated"] },
      createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
    });

    const studentGrowthRate =
      studentsLastMonth.length > 0
        ? (
            ((uniqueStudents.length - studentsLastMonth.length) /
              studentsLastMonth.length) *
            100
          ).toFixed(1)
        : 100;

    // Calculate session growth
    const sessionsLastMonth = await bookingModel.countDocuments({
      tutorId: tutorId,
      status: { $in: ["tutorConfirmed", "ongoing"] },
      isActive: true,
      createdAt: { $gte: lastMonth },
    });

    const sessionsBeforeLastMonth = await bookingModel.countDocuments({
      tutorId: tutorId,
      status: { $in: ["tutorConfirmed", "ongoing"] },
      isActive: true,
      createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
    });

    const sessionGrowthRate =
      sessionsBeforeLastMonth > 0
        ? (
            ((sessionsLastMonth - sessionsBeforeLastMonth) /
              sessionsBeforeLastMonth) *
            100
          ).toFixed(1)
        : 100;

    // Get recent assignments
    const recentAssignments = await assignmentModel
      .find({ tutorId: tutorId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("studentId", "username")
      .select("title subject dueDate status");

    // Get upcoming bookings using the function getUpcomingSessions
    const upcomingBookings = await getUpcomingSessionsForTutor(tutorId);

    // Get monthly stats (bookings per month for the last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await bookingModel.aggregate([
      {
        $match: {
          tutorId: new mongoose.Types.ObjectId(tutorId),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          earnings: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format monthly stats for easier frontend use
    const formattedMonthlyStats = monthlyStats.map((stat) => {
      const date = new Date(stat._id.year, stat._id.month - 1, 1);
      const monthName = date.toLocaleString("default", { month: "short" });
      return {
        month: `${monthName} ${stat._id.year}`,
        bookings: stat.count,
        earnings: stat.earnings,
      };
    });

    // Get subject distribution
    const subjectDistribution = await timeSlotModel.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(tutorId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$subjectName",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get completion rate
    const totalCompletedSessions = await bookingModel.countDocuments({
      tutorId: tutorId,
      status: { $in: ["completed", "rated"] },
    });

    const totalCancelledSessions = await bookingModel.countDocuments({
      tutorId: tutorId,
      status: "cancelled",
    });

    const completionRate =
      totalCompletedSessions + totalCancelledSessions > 0
        ? (
            (totalCompletedSessions /
              (totalCompletedSessions + totalCancelledSessions)) *
            100
          ).toFixed(1)
        : 100;

    const repeatStudentCount = await bookingModel.aggregate([
      {
        $match: {
          tutorId: new mongoose.Types.ObjectId(tutorId),
          status: { $in: ["ongoing", "completed"] },
        },
      },
      {
        $group: {
          _id: "$studentId",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $count: "repeatStudents",
      },
    ]);

    const totalStudentCount = uniqueStudents.length;
    const repeatStudentRate =
      totalStudentCount > 0 && repeatStudentCount.length > 0
        ? (
            (repeatStudentCount[0].repeatStudents / totalStudentCount) *
            100
          ).toFixed(1)
        : 0;

    // Tutor tips
    const tutorTips = [
      {
        id: 1,
        tip: "Boost student engagement by providing specific, actionable feedback on assignments. Highlight what they did well and suggest concrete improvements.",
      },
      {
        id: 2,
        tip: "Use visual aids and real-world examples to explain complex concepts. This helps students make connections and retain information better.",
      },
      {
        id: 3,
        tip: "Start each session with a quick review of previous material. This reinforces learning and helps identify any concepts that need clarification.",
      },
      {
        id: 4,
        tip: "Encourage students to explain concepts back to you in their own words. This technique, known as the 'teach-back' method, improves comprehension.",
      },
      {
        id: 5,
        tip: "Customize your teaching approach to match each student's learning style. Some students learn best visually, others through discussion or practice problems.",
      },
    ];

    return res.status(200).json({
      IsSuccess: true,
      Result: {
        tutor,
        stats: {
          totalStudents: uniqueStudents.length,
          activeSessions,
          averageRating,
          totalReviews,
          newMessages,
          studentGrowthRate,
          sessionGrowthRate,
          completionRate,
          repeatStudentRate,
        },
        recentAssignments,
        upcomingBookings,
        monthlyStats: formattedMonthlyStats,
        subjectDistribution,
        tutorTips,
      },
      Message: "Dashboard data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({
      IsSuccess: false,
      Message: "Failed to fetch dashboard data",
      Error: error.message,
    });
  }
};

// Toggle tutor availability
exports.toggleAvailability = async (req, res) => {
  try {
    const tutorId = req.user.sub;
    const tutor = await tutorModel.findById(tutorId);

    if (!tutor) {
      return res.status(404).json({
        IsSuccess: false,
        Message: "Tutor not found",
      });
    }

    tutor.isAvailable = !tutor.isAvailable;
    await tutor.save();

    return res.status(200).json({
      IsSuccess: true,
      Result: {
        isAvailable: tutor.isAvailable,
      },
      Message: `Availability changed to ${
        tutor.isAvailable ? "Available" : "Unavailable"
      }`,
    });
  } catch (error) {
    console.error("Error toggling availability:", error);
    return res.status(500).json({
      IsSuccess: false,
      Message: "Failed to toggle availability",
      Error: error.message,
    });
  }
};

// Get recent assignments with more details
exports.getRecentAssignments = async (req, res) => {
  try {
    const tutorId = req.user.sub;

    const assignments = await assignmentModel
      .find({ tutorId: tutorId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 10)
      .populate("studentId", "username email")
      .populate("bookingId", "status");

    return res.status(200).json({
      IsSuccess: true,
      Result: assignments,
      Message: "Recent assignments fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching recent assignments:", error);
    return res.status(500).json({
      IsSuccess: false,
      Message: "Failed to fetch recent assignments",
      Error: error.message,
    });
  }
};

// Get earnings statistics
exports.getEarningsStats = async (req, res) => {
  try {
    const tutorId = req.user.sub;
    const timeRange = req.query.range || "month";

    // Set the date range
    const endDate = new Date();
    let startDate = new Date();

    if (timeRange === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeRange === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Aggregate earnings based on time range
    const earnings = await bookingModel.aggregate([
      {
        $match: {
          tutorId: new mongoose.Types.ObjectId(tutorId),
          status: { $in: ["completed", "ongoing", "rated"] },
          paymentStatus: "completed",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get earnings breakdown by subject
    const earningsBySubject = await bookingModel.aggregate([
      {
        $match: {
          tutorId: new mongoose.Types.ObjectId(tutorId),
          status: { $in: ["completed", "ongoing", "rated"] },
          paymentStatus: "completed",
        },
      },
      {
        $lookup: {
          from: "timeslots",
          localField: "timeSlotId",
          foreignField: "_id",
          as: "timeSlotDetails",
        },
      },
      { $unwind: "$timeSlotDetails" },
      {
        $group: {
          _id: "$timeSlotDetails.subjectName",
          totalEarnings: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalEarnings: -1 } },
    ]);

    // Calculate growth compared to previous period
    let previousStartDate = new Date(startDate);
    if (timeRange === "week") {
      previousStartDate.setDate(previousStartDate.getDate() - 7);
    } else if (timeRange === "month") {
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    } else if (timeRange === "year") {
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
    }

    const previousEarnings = await bookingModel.aggregate([
      {
        $match: {
          tutorId: new mongoose.Types.ObjectId(tutorId),
          status: { $in: ["completed", "ongoing", "rated"] },
          paymentStatus: "completed",
          createdAt: { $gte: previousStartDate, $lt: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const currentEarningsTotal =
      earnings.length > 0 ? earnings[0].totalEarnings : 0;
    const previousEarningsTotal =
      previousEarnings.length > 0 ? previousEarnings[0].totalEarnings : 0;

    const earningsGrowthRate =
      previousEarningsTotal > 0
        ? (
            ((currentEarningsTotal - previousEarningsTotal) /
              previousEarningsTotal) *
            100
          ).toFixed(1)
        : 100;

    const currentBookingsTotal = earnings.length > 0 ? earnings[0].count : 0;
    const previousBookingsTotal =
      previousEarnings.length > 0 ? previousEarnings[0].count : 0;

    const bookingsGrowthRate =
      previousBookingsTotal > 0
        ? (
            ((currentBookingsTotal - previousBookingsTotal) /
              previousBookingsTotal) *
            100
          ).toFixed(1)
        : 100;

    // Format response
    return res.status(200).json({
      IsSuccess: true,
      Result: {
        totalEarnings: currentEarningsTotal,
        totalBookings: currentBookingsTotal,
        earningsBySubject,
        earningsGrowthRate,
        bookingsGrowthRate,
        timeRange,
      },
      Message: "Earnings statistics fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching earnings statistics:", error);
    return res.status(500).json({
      IsSuccess: false,
      Message: "Failed to fetch earnings statistics",
      Error: error.message,
    });
  }
};

// Get upcoming sessions endpoint
exports.getUpcomingSessions = async (req, res) => {
  try {
    const tutorId = req.user.sub;
    const upcomingSessions = await getUpcomingSessionsForTutor(tutorId);

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

// Get upcoming sessions for tutor
async function getUpcomingSessionsForTutor(tutorId) {
  try {
    const now = moment();

    const upcomingBookings = await bookingModel
      .find({
        tutorId: new mongoose.Types.ObjectId(tutorId),
        status: { $in: ["tutorConfirmed", "ongoing"] },
        teachingMode: "online",
        isActive: true,
      })
      .populate({
        path: "studentId",
        select: "username image",
      })
      .populate({
        path: "tutorId",
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
          studentId: booking.studentId._id,
          studentName: booking.studentId.username,
          studentImage: booking.studentId.image,
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
          yourName: booking.tutorId.username,
          anotherPersonName: booking.studentId.username,
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

    return upcomingSessions;
  } catch (error) {
    console.error("Error getting upcoming sessions for tutor:", error);
    return [];
  }
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
