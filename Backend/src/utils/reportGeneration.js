const UserModel = require("../users/userModel");
const TutorModel = require("../tutors/tutorModel");
const BookingModel = require("../booking/bookingModel");
const KhaltiPayment = require("../payment/paymentModel");
const Excel = require("exceljs");

/**
 * Get report preview data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const previewReport = async (req, res) => {
  try {
    const { reportType, dateRange, includeCharts, from, to } = req.query;
    // Get date range
    const { startDate, endDate, rangeText } = getDateRange(dateRange, from, to);
    // Generate report data based on type
    let reportData;
    switch (reportType) {
      case "users":
        reportData = await generateUserReport(startDate, endDate);
        break;
      case "bookings":
        reportData = await generateBookingReport(startDate, endDate);
        break;
      case "payments":
        reportData = await generatePaymentReport(startDate, endDate);
        break;
      case "comprehensive":
        reportData = await generateComprehensiveReport(startDate, endDate);
        break;
      default:
        return res.status(400).json({ message: "Invalid report type" });
    }
    // Format report data for preview
    const preview = {
      title: reportData.title,
      dateRange: rangeText,
      summary: reportData.summary,
      sections: reportData.sections,
    };
    res.status(200).json(preview);
  } catch (error) {
    console.error("Error generating report preview:", error);
    res.status(500).json({
      message: "Failed to generate report preview",
      error: error.message,
    });
  }
};

/**
 * Download Excel report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const downloadReport = async (req, res) => {
  try {
    const { reportType, dateRange, from, to } = req.query;
    // Get date range
    const { startDate, endDate, rangeText } = getDateRange(dateRange, from, to);
    // Generate report data based on type
    let reportData;
    switch (reportType) {
      case "users":
        reportData = await generateUserReport(startDate, endDate);
        break;
      case "bookings":
        reportData = await generateBookingReport(startDate, endDate);
        break;
      case "payments":
        reportData = await generatePaymentReport(startDate, endDate);
        break;
      case "comprehensive":
        reportData = await generateComprehensiveReport(startDate, endDate);
        break;
      default:
        return res.status(400).json({ message: "Invalid report type" });
    }

    // Generate Excel report
    const fileName = `${reportType}_report_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    const contentType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const fileContent = await generateExcelReport(reportData, rangeText);

    // Set response headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Send file
    res.send(fileContent);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      message: "Failed to generate report",
      error: error.message,
    });
  }
};

/**
 * Get date range based on selection
 * @param {String} rangeType - Type of date range
 * @param {String} fromDate - Custom from date
 * @param {String} toDate - Custom to date
 * @returns {Object} Start date, end date and range text
 */
function getDateRange(rangeType, fromDate, toDate) {
  const endDate = new Date();
  let startDate = new Date();
  let rangeText = "";
  switch (rangeType) {
    case "daily":
      startDate.setDate(startDate.getDate() - 1);
      rangeText = "Last 24 hours";
      break;
    case "weekly":
      startDate.setDate(startDate.getDate() - 7);
      rangeText = "Last 7 days";
      break;
    case "monthly":
      startDate.setMonth(startDate.getMonth() - 1);
      rangeText = "Last 30 days";
      break;
    case "quarterly":
      startDate.setMonth(startDate.getMonth() - 3);
      rangeText = "Last 3 months";
      break;
    case "yearly":
      startDate.setFullYear(startDate.getFullYear() - 1);
      rangeText = "Last 12 months";
      break;
    case "custom":
      if (fromDate && toDate) {
        startDate = new Date(fromDate);
        endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        // Format date for display
        const fromDisplay = startDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const toDisplay = endDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        rangeText = `${fromDisplay} to ${toDisplay}`;
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
        rangeText = "Last 30 days (default)";
      }
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
      rangeText = "Last 30 days (default)";
  }
  return { startDate, endDate, rangeText };
}

/**
 * Generate user statistics report
 * @param {Date} startDate - Start date for report
 * @param {Date} endDate - End date for report
 * @returns {Object} Report data
 */
async function generateUserReport(startDate, endDate) {
  // Get total users counts
  const totalUsers = await UserModel.countDocuments();
  const totalTutors = await TutorModel.countDocuments();
  // Get users in time period
  const newUsers = await UserModel.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });
  const newTutors = await TutorModel.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });
  // Get previous period for comparison
  const prevStartDate = new Date(startDate);
  const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  prevStartDate.setDate(prevStartDate.getDate() - diffDays);
  const prevPeriodUsers = await UserModel.countDocuments({
    createdAt: { $gte: prevStartDate, $lt: startDate },
  });
  const prevPeriodTutors = await TutorModel.countDocuments({
    createdAt: { $gte: prevStartDate, $lt: startDate },
  });
  // Calculate growth percentages
  const userGrowth =
    prevPeriodUsers > 0
      ? Math.round(((newUsers - prevPeriodUsers) / prevPeriodUsers) * 100)
      : 100;
  const tutorGrowth =
    prevPeriodTutors > 0
      ? Math.round(((newTutors - prevPeriodTutors) / prevPeriodTutors) * 100)
      : 100;
  // Get tutor verification stats
  const verifiedTutors = await TutorModel.countDocuments({
    isVerified: "verified",
  });
  const pendingTutors = await TutorModel.countDocuments({
    isVerified: "pending",
  });
  const rejectedTutors = await TutorModel.countDocuments({
    isVerified: "rejected",
  });
  // Get user activity stats
  const activeUsersCount = await UserModel.countDocuments({
    lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });
  // Get monthly user registrations for chart
  const monthlyRegistrations = await getMonthlyRegistrations(6);
  // Get newest users
  const newestUsers = await UserModel.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("username email grade phoneNumber createdAt")
    .lean();
  // Get newest tutors
  const newestTutors = await TutorModel.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("username email gender grade teachingLocation isVerified createdAt")
    .lean();
  // Format data for report
  return {
    title: "User Statistics Report",
    summary: [
      {
        label: "Total Students",
        value: totalUsers.toLocaleString(),
        change: userGrowth,
      },
      {
        label: "Total Tutors",
        value: totalTutors.toLocaleString(),
        change: tutorGrowth,
      },
      { label: "New Students", value: newUsers.toLocaleString() },
      { label: "New Tutors", value: newTutors.toLocaleString() },
    ],
    sections: [
      {
        title: "User Overview",
        icon: "users",
        tables: [
          {
            title: "User Summary",
            headers: ["Category", "Count", "Percentage"],
            rows: [
              ["Total Students", totalUsers.toLocaleString(), "100%"],
              ["Total Tutors", totalTutors.toLocaleString(), "100%"],
              [
                "Verified Tutors",
                verifiedTutors.toLocaleString(),
                `${Math.round((verifiedTutors / totalTutors) * 100)}%`,
              ],
              [
                "Pending Verification",
                pendingTutors.toLocaleString(),
                `${Math.round((pendingTutors / totalTutors) * 100)}%`,
              ],
              [
                "Rejected Tutors",
                rejectedTutors.toLocaleString(),
                `${Math.round((rejectedTutors / totalTutors) * 100)}%`,
              ],
            ],
          },
          {
            title: "Newest Students",
            headers: [
              "Username",
              "Email",
              "Grade",
              "Phone",
              "Registration Date",
            ],
            rows: newestUsers.map((user) => [
              user.username,
              user.email,
              user.grade,
              user.phoneNumber,
              new Date(user.createdAt).toLocaleDateString(),
            ]),
          },
          {
            title: "Newest Tutors",
            headers: [
              "Username",
              "Email",
              "Gender",
              "Grade",
              "Teaching Mode",
              "Status",
              "Registration Date",
            ],
            rows: newestTutors.map((tutor) => [
              tutor.username,
              tutor.email,
              tutor.gender,
              tutor.grade,
              tutor.teachingLocation,
              tutor.isVerified,
              new Date(tutor.createdAt).toLocaleDateString(),
            ]),
          },
        ],
        charts: [
          {
            title: "User Registration Trends",
            type: "bar",
            data: monthlyRegistrations.map((item) => ({
              label: item.month,
              value: item.students,
            })),
            maxValue: Math.max(
              ...monthlyRegistrations.map((item) => item.students)
            ),
          },
          {
            title: "Tutor Verification Status",
            type: "pie",
            data: [
              { label: "Verified", value: verifiedTutors },
              { label: "Pending", value: pendingTutors },
              { label: "Rejected", value: rejectedTutors },
            ],
          },
        ],
      },
    ],
    rawData: {
      users: newestUsers,
      tutors: newestTutors,
      monthlyRegistrations,
    },
  };
}

/**
 * Generate booking statistics report
 * @param {Date} startDate - Start date for report
 * @param {Date} endDate - End date for report
 * @returns {Object} Report data
 */
async function generateBookingReport(startDate, endDate) {
  // Get total bookings
  const totalBookings = await BookingModel.countDocuments();
  // Get bookings in time period
  const newBookings = await BookingModel.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });
  // Get previous period for comparison
  const prevStartDate = new Date(startDate);
  const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  prevStartDate.setDate(prevStartDate.getDate() - diffDays);
  const prevPeriodBookings = await BookingModel.countDocuments({
    createdAt: { $gte: prevStartDate, $lt: startDate },
  });
  // Calculate growth percentage
  const bookingGrowth =
    prevPeriodBookings > 0
      ? Math.round(
          ((newBookings - prevPeriodBookings) / prevPeriodBookings) * 100
        )
      : 100;
  // Get booking status breakdown
  const bookingStatusCounts = await BookingModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  // Get teaching mode breakdown
  const teachingModeCounts = await BookingModel.aggregate([
    {
      $group: {
        _id: "$teachingMode",
        count: { $sum: 1 },
      },
    },
  ]);
  // Get most booked tutors
  const mostBookedTutors = await BookingModel.aggregate([
    {
      $group: {
        _id: "$tutorId",
        bookingCount: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
    {
      $sort: { bookingCount: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "tutors",
        localField: "_id",
        foreignField: "_id",
        as: "tutorInfo",
      },
    },
    {
      $unwind: "$tutorInfo",
    },
    {
      $project: {
        tutorName: "$tutorInfo.username",
        tutorEmail: "$tutorInfo.email",
        bookingCount: 1,
        totalAmount: 1,
      },
    },
  ]);
  // Get recent bookings
  const recentBookings = await BookingModel.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("studentId", "username email")
    .populate("tutorId", "username email")
    .lean();
  // Get monthly booking trends
  const monthlyBookings = await getMonthlyBookings(6);
  // Format status counts for display
  const statusCounts = {};
  bookingStatusCounts.forEach((item) => {
    statusCounts[item._id] = item.count;
  });
  // Format teaching mode counts for display
  const teachingMode = {
    online: 0,
    physical: 0,
  };
  teachingModeCounts.forEach((item) => {
    if (item._id === "online" || item._id === "physical") {
      teachingMode[item._id] = item.count;
    }
  });
  // Format data for report
  return {
    title: "Booking Statistics Report",
    summary: [
      {
        label: "Total Bookings",
        value: totalBookings.toLocaleString(),
        change: bookingGrowth,
      },
      { label: "New Bookings", value: newBookings.toLocaleString() },
      {
        label: "Completed Bookings",
        value: (statusCounts.completed || 0).toLocaleString(),
      },
      {
        label: "Ongoing Bookings",
        value: (statusCounts.ongoing || 0).toLocaleString(),
      },
    ],
    sections: [
      {
        title: "Booking Overview",
        icon: "chart",
        tables: [
          {
            title: "Booking Status Breakdown",
            headers: ["Status", "Count", "Percentage"],
            rows: bookingStatusCounts.map((item) => [
              item._id.charAt(0).toUpperCase() + item._id.slice(1),
              item.count.toLocaleString(),
              `${Math.round((item.count / totalBookings) * 100)}%`,
            ]),
          },
          {
            title: "Teaching Mode Distribution",
            headers: ["Mode", "Count", "Percentage"],
            rows: [
              [
                "Online",
                teachingMode.online.toLocaleString(),
                `${Math.round((teachingMode.online / totalBookings) * 100)}%`,
              ],
              [
                "Physical",
                teachingMode.physical.toLocaleString(),
                `${Math.round((teachingMode.physical / totalBookings) * 100)}%`,
              ],
            ],
          },
          {
            title: "Most Booked Tutors",
            headers: ["Tutor Name", "Email", "Booking Count", "Total Revenue"],
            rows: mostBookedTutors.map((tutor) => [
              tutor.tutorName,
              tutor.tutorEmail,
              tutor.bookingCount.toLocaleString(),
              `NPR ${tutor.totalAmount.toLocaleString()}`,
            ]),
          },
        ],
        charts: [
          {
            title: "Monthly Booking Trends",
            type: "line",
            data: monthlyBookings.map((item) => ({
              label: item.month,
              value: item.count,
            })),
            maxValue: Math.max(...monthlyBookings.map((item) => item.count)),
          },
          {
            title: "Booking Status Distribution",
            type: "pie",
            data: bookingStatusCounts.map((item) => ({
              label: item._id.charAt(0).toUpperCase() + item._id.slice(1),
              value: item.count,
            })),
          },
        ],
      },
      {
        title: "Recent Bookings",
        icon: "activity",
        tables: [
          {
            title: "Recent Booking Activities",
            headers: ["Student", "Tutor", "Amount", "Date", "Status"],
            rows: recentBookings.map((booking) => [
              booking.studentId ? booking.studentId.username : "Unknown",
              booking.tutorId ? booking.tutorId.username : "Unknown",
              `NPR ${booking.totalAmount.toLocaleString()}`,
              new Date(booking.createdAt).toLocaleDateString(),
              booking.status,
            ]),
          },
        ],
      },
    ],
    rawData: {
      bookingStatusCounts,
      teachingModeCounts,
      mostBookedTutors,
      recentBookings,
      monthlyBookings,
    },
  };
}

/**
 * Generate payment statistics report
 * @param {Date} startDate - Start date for report
 * @param {Date} endDate - End date for report
 * @returns {Object} Report data
 */
async function generatePaymentReport(startDate, endDate) {
  // Get total payments
  const totalPayments = await KhaltiPayment.countDocuments({
    status: "COMPLETED",
  });
  // Get total revenue
  const totalRevenue = await KhaltiPayment.aggregate([
    {
      $match: { status: "COMPLETED" },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]).then((result) => (result.length > 0 ? result[0].total : 0));
  // Get revenue in time period
  const periodRevenue = await KhaltiPayment.aggregate([
    {
      $match: {
        status: "COMPLETED",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]).then((result) => (result.length > 0 ? result[0].total : 0));
  // Get payments in time period
  const periodPayments = await KhaltiPayment.countDocuments({
    status: "COMPLETED",
    createdAt: { $gte: startDate, $lte: endDate },
  });
  // Get previous period for comparison
  const prevStartDate = new Date(startDate);
  const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  prevStartDate.setDate(prevStartDate.getDate() - diffDays);
  const prevPeriodRevenue = await KhaltiPayment.aggregate([
    {
      $match: {
        status: "COMPLETED",
        createdAt: { $gte: prevStartDate, $lt: startDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]).then((result) => (result.length > 0 ? result[0].total : 0));
  // Calculate growth percentage
  const revenueGrowth =
    prevPeriodRevenue > 0
      ? Math.round(
          ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100
        )
      : 100;
  // Get payment status breakdown
  const paymentStatusCounts = await KhaltiPayment.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  // Get top paying students
  const topPayingStudents = await KhaltiPayment.aggregate([
    {
      $match: { status: "COMPLETED" },
    },
    {
      $group: {
        _id: "$studentId",
        paymentCount: { $sum: 1 },
        totalPaid: { $sum: "$amount" },
      },
    },
    {
      $sort: { totalPaid: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    {
      $unwind: "$studentInfo",
    },
    {
      $project: {
        studentName: "$studentInfo.username",
        studentEmail: "$studentInfo.email",
        paymentCount: 1,
        totalPaid: 1,
      },
    },
  ]);
  // Get highest earning tutors
  const highestEarningTutors = await BookingModel.aggregate([
    {
      $match: { paymentStatus: "completed" },
    },
    {
      $group: {
        _id: "$tutorId",
        bookingCount: { $sum: 1 },
        totalEarned: { $sum: "$totalAmount" },
      },
    },
    {
      $sort: { totalEarned: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "tutors",
        localField: "_id",
        foreignField: "_id",
        as: "tutorInfo",
      },
    },
    {
      $unwind: "$tutorInfo",
    },
    {
      $project: {
        tutorName: "$tutorInfo.username",
        tutorEmail: "$tutorInfo.email",
        bookingCount: 1,
        totalEarned: 1,
      },
    },
  ]);
  // Get recent payments
  const recentPayments = await KhaltiPayment.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("studentId", "username email")
    .populate("bookingId")
    .lean();
  // Get monthly revenue data
  const monthlyRevenue = await getMonthlyRevenue(6);
  // Format data for report
  return {
    title: "Payment & Revenue Report",
    summary: [
      {
        label: "Total Revenue",
        value: `NPR ${totalRevenue.toLocaleString()}`,
        change: revenueGrowth,
      },
      {
        label: "Period Revenue",
        value: `NPR ${periodRevenue.toLocaleString()}`,
      },
      { label: "Total Payments", value: totalPayments.toLocaleString() },
      { label: "Period Payments", value: periodPayments.toLocaleString() },
    ],
    sections: [
      {
        title: "Revenue Overview",
        icon: "money",
        tables: [
          {
            title: "Payment Status Breakdown",
            headers: ["Status", "Count", "Percentage"],
            rows: paymentStatusCounts.map((item) => {
              const total = paymentStatusCounts.reduce(
                (acc, curr) => acc + curr.count,
                0
              );
              return [
                item._id,
                item.count.toLocaleString(),
                `${Math.round((item.count / total) * 100)}%`,
              ];
            }),
          },
          {
            title: "Top Paying Students",
            headers: ["Student Name", "Email", "Payment Count", "Total Amount"],
            rows: topPayingStudents.map((student) => [
              student.studentName,
              student.studentEmail,
              student.paymentCount.toLocaleString(),
              `NPR ${student.totalPaid.toLocaleString()}`,
            ]),
          },
          {
            title: "Highest Earning Tutors",
            headers: ["Tutor Name", "Email", "Booking Count", "Total Earned"],
            rows: highestEarningTutors.map((tutor) => [
              tutor.tutorName,
              tutor.tutorEmail,
              tutor.bookingCount.toLocaleString(),
              `NPR ${tutor.totalEarned.toLocaleString()}`,
            ]),
          },
        ],
        charts: [
          {
            title: "Monthly Revenue Trends",
            type: "bar",
            data: monthlyRevenue.map((item) => ({
              label: item.month,
              value: item.amount,
            })),
            maxValue: Math.max(...monthlyRevenue.map((item) => item.amount)),
          },
        ],
      },
      {
        title: "Recent Transactions",
        icon: "activity",
        tables: [
          {
            title: "Recent Payment Activities",
            headers: ["Transaction ID", "Student", "Amount", "Date", "Status"],
            rows: recentPayments.map((payment) => [
              payment.transactionId || payment.pidx || "N/A",
              payment.studentId ? payment.studentId.username : "Unknown",
              `NPR ${payment.amount.toLocaleString()}`,
              new Date(payment.createdAt).toLocaleDateString(),
              payment.status,
            ]),
          },
        ],
      },
    ],
    rawData: {
      paymentStatusCounts,
      topPayingStudents,
      highestEarningTutors,
      recentPayments,
      monthlyRevenue,
    },
  };
}

/**
 * Generate comprehensive report combining all other reports
 * @param {Date} startDate - Start date for report
 * @param {Date} endDate - End date for report
 * @returns {Object} Report data
 */
async function generateComprehensiveReport(startDate, endDate) {
  // Get data from all reports
  const userReport = await generateUserReport(startDate, endDate);
  const bookingReport = await generateBookingReport(startDate, endDate);
  const paymentReport = await generatePaymentReport(startDate, endDate);
  // Combine summary data
  const summary = [
    ...userReport.summary.slice(0, 2),
    ...bookingReport.summary.slice(0, 1),
    ...paymentReport.summary.slice(0, 1),
  ];
  // Combine sections data, taking key sections from each report
  const sections = [
    // User section
    {
      title: "User Statistics",
      icon: "users",
      tables: [userReport.sections[0].tables[0]],
      charts: userReport.sections[0].charts,
    },
    // Booking section
    {
      title: "Booking Statistics",
      icon: "chart",
      tables: [
        bookingReport.sections[0].tables[0],
        bookingReport.sections[0].tables[2],
      ],
      charts: bookingReport.sections[0].charts,
    },
    // Payment section
    {
      title: "Revenue Statistics",
      icon: "money",
      tables: [
        paymentReport.sections[0].tables[1],
        paymentReport.sections[0].tables[2],
      ],
      charts: paymentReport.sections[0].charts,
    },
  ];
  // Format data for report
  return {
    title: "Comprehensive Platform Report",
    summary,
    sections,
    rawData: {
      userReport: userReport.rawData,
      bookingReport: bookingReport.rawData,
      paymentReport: paymentReport.rawData,
    },
  };
}

/**
 * Get monthly user registrations
 * @param {Number} months - Number of months to include
 * @returns {Array} Monthly registration data
 */
async function getMonthlyRegistrations(months) {
  const result = [];
  const currentDate = new Date();
  // Generate months array
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    result.push({
      month: `${monthName} ${year}`,
      students: 0,
      tutors: 0,
    });
  }
  // Calculate start date (months ago from now)
  const startDate = new Date();
  startDate.setMonth(currentDate.getMonth() - (months - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  // Get student registrations by month
  // Get student registrations by month
  const studentData = await UserModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  // Get tutor registrations by month
  const tutorData = await TutorModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  // Map student data to result
  studentData.forEach((item) => {
    const date = new Date(item._id.year, item._id.month - 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const monthKey = `${monthName} ${year}`;
    const resultItem = result.find((r) => r.month === monthKey);
    if (resultItem) {
      resultItem.students = item.count;
    }
  });
  // Map tutor data to result
  tutorData.forEach((item) => {
    const date = new Date(item._id.year, item._id.month - 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const monthKey = `${monthName} ${year}`;
    const resultItem = result.find((r) => r.month === monthKey);
    if (resultItem) {
      resultItem.tutors = item.count;
    }
  });
  return result;
}

/**
 * Get monthly bookings
 * @param {Number} months - Number of months to include
 * @returns {Array} Monthly booking data
 */
async function getMonthlyBookings(months) {
  const result = [];
  const currentDate = new Date();
  // Generate months array
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    result.push({
      month: `${monthName} ${year}`,
      count: 0,
    });
  }
  // Calculate start date (months ago from now)
  const startDate = new Date();
  startDate.setMonth(currentDate.getMonth() - (months - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  // Get bookings by month
  const bookingData = await BookingModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  // Map booking data to result
  bookingData.forEach((item) => {
    const date = new Date(item._id.year, item._id.month - 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const monthKey = `${monthName} ${year}`;
    const resultItem = result.find((r) => r.month === monthKey);
    if (resultItem) {
      resultItem.count = item.count;
    }
  });
  return result;
}

/**
 * Get monthly revenue
 * @param {Number} months - Number of months to include
 * @returns {Array} Monthly revenue data
 */
async function getMonthlyRevenue(months) {
  const result = [];
  const currentDate = new Date();
  // Generate months array
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    result.push({
      month: `${monthName} ${year}`,
      amount: 0,
    });
  }
  // Calculate start date (months ago from now)
  const startDate = new Date();
  startDate.setMonth(currentDate.getMonth() - (months - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  // Get revenue by month
  const revenueData = await KhaltiPayment.aggregate([
    {
      $match: {
        status: "COMPLETED",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        total: { $sum: "$amount" },
      },
    },
  ]);
  // Map revenue data to result
  revenueData.forEach((item) => {
    const date = new Date(item._id.year, item._id.month - 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const monthKey = `${monthName} ${year}`;
    const resultItem = result.find((r) => r.month === monthKey);
    if (resultItem) {
      resultItem.amount = item.total;
    }
  });
  return result;
}

/**
 * Generate Excel report
 * @param {Object} reportData - Report data
 * @param {String} dateRange - Date range text
 * @returns {Buffer} Excel file buffer
 */
async function generateExcelReport(reportData, dateRange) {
  try {
    const workbook = new Excel.Workbook();

    // Add title sheet with summary
    const summarySheet = workbook.addWorksheet("Summary");

    // Add title and date
    summarySheet.addRow([reportData.title]);
    summarySheet.getRow(1).font = { size: 16, bold: true };
    summarySheet.getCell("A1").alignment = { horizontal: "center" };
    summarySheet.addRow([`Report Period: ${dateRange}`]);
    summarySheet.addRow([
      `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    ]);
    summarySheet.mergeCells("A1:F1");
    summarySheet.mergeCells("A2:F2");
    summarySheet.mergeCells("A3:F3");

    // Add summary data
    summarySheet.addRow([]);
    summarySheet.addRow(["Summary"]);
    summarySheet.getRow(5).font = { size: 14, bold: true };

    const summaryRow = summarySheet.addRow([]);
    const detailRow = summarySheet.addRow([]);
    const changeRow = summarySheet.addRow([]);

    reportData.summary.forEach((item, index) => {
      summaryRow.getCell(index + 1).value = item.label;
      summaryRow.getCell(index + 1).font = { bold: true };

      detailRow.getCell(index + 1).value = item.value;
      detailRow.getCell(index + 1).font = { size: 14 };

      if (item.change !== undefined) {
        const changeText = `${item.change >= 0 ? "↑" : "↓"} ${Math.abs(
          item.change
        )}%`;
        changeRow.getCell(index + 1).value = changeText;
        changeRow.getCell(index + 1).font = {
          color: { argb: item.change >= 0 ? "00FF00" : "FF0000" },
        };
      }
    });

    // Add styling to summary sheet
    summarySheet.columns.forEach((column) => {
      column.width = 20;
    });

    // Add chart data in tabular format instead of charts
    if (
      reportData.sections &&
      reportData.sections[0] &&
      reportData.sections[0].charts
    ) {
      summarySheet.addRow([]);
      summarySheet.addRow(["Key Metrics Visualization (Tabular Format)"]);
      summarySheet.getRow(10).font = { size: 14, bold: true };

      // Add chart data for the first chart
      if (reportData.sections[0].charts[0]) {
        const chartData = reportData.sections[0].charts[0];

        // Add header row
        summarySheet.addRow([chartData.title]);
        summarySheet.getRow(12).font = { bold: true };
        
        // Add data headers
        summarySheet.addRow(["Label", "Value"]);
        summarySheet.getRow(13).font = { bold: true };

        // Add data rows
        chartData.data.forEach((item, index) => {
          summarySheet.addRow([item.label, item.value]);
        });
      }
    }

    // Add section sheets
    reportData.sections.forEach((section) => {
      const sectionSheet = workbook.addWorksheet(section.title);

      // Add section title
      sectionSheet.addRow([section.title]);
      sectionSheet.getRow(1).font = { size: 16, bold: true };
      sectionSheet.addRow([]);

      let rowIndex = 3;

      // Add tables
      section.tables.forEach((table) => {
        sectionSheet.addRow([table.title]);
        sectionSheet.getRow(rowIndex).font = { size: 14, bold: true };
        rowIndex++;

        // Headers
        const headerRow = sectionSheet.addRow(table.headers);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        rowIndex++;

        // Data rows
        table.rows.forEach((row) => {
          sectionSheet.addRow(row);
          sectionSheet.getRow(rowIndex).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          rowIndex++;
        });

        rowIndex += 2;
      });

      // Add chart data as tables
      if (section.charts && section.charts.length > 0) {
        section.charts.forEach((chart, chartIndex) => {
          // Add chart title
          sectionSheet.addRow([chart.title + " (Data Table)"]);
          sectionSheet.getRow(rowIndex).font = { size: 14, bold: true };
          rowIndex++;

          // Add header row for chart data
          sectionSheet.addRow(["Label", "Value"]);
          sectionSheet.getRow(rowIndex).font = { bold: true };
          rowIndex++;

          // Style headers
          ["A", "B"].forEach(col => {
            sectionSheet.getCell(`${col}${rowIndex-1}`).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE0E0E0" },
            };
            sectionSheet.getCell(`${col}${rowIndex-1}`).border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });

          // Add data rows
          chart.data.forEach((item) => {
            sectionSheet.addRow([item.label, item.value]);
            // Style cells
            ["A", "B"].forEach(col => {
              sectionSheet.getCell(`${col}${rowIndex}`).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
              };
            });
            rowIndex++;
          });

          // Add note about charts
          sectionSheet.addRow([]);
          sectionSheet.addRow(["Note: Chart visualization is not available in this export. Please refer to the data table above."]);
          sectionSheet.getRow(rowIndex+1).font = { italic: true };
          rowIndex += 3;
        });
      }

      // Auto fit columns
      sectionSheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 10;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = Math.min(maxLength + 2, 40);
      });
    });

    // Add raw data sheet
    if (reportData.rawData) {
      const dataSheet = workbook.addWorksheet("Raw Data");

      // Add raw data in structured format
      dataSheet.addRow(["Raw Data"]);
      dataSheet.getRow(1).font = { size: 14, bold: true };

      // Add data explanation
      dataSheet.addRow([
        "This sheet contains the raw data used to generate the report charts and tables.",
      ]);
      dataSheet.addRow([]);

      // If there's monthly data, add it in table format
      if (reportData.rawData.monthlyRegistrations) {
        dataSheet.addRow(["Monthly User Registrations"]);
        dataSheet.getRow(4).font = { bold: true };

        // Add headers
        dataSheet.addRow(["Month", "Students", "Tutors"]);
        dataSheet.getRow(5).font = { bold: true };

        // Add data
        reportData.rawData.monthlyRegistrations.forEach((item) => {
          dataSheet.addRow([item.month, item.students, item.tutors]);
        });
      }

      // Monthly booking data if available
      if (reportData.rawData.bookingReport && reportData.rawData.bookingReport.monthlyBookings) {
        dataSheet.addRow([]);
        dataSheet.addRow(["Monthly Booking Trends"]);
        dataSheet.getRow(dataSheet.rowCount).font = { bold: true };

        // Add headers
        dataSheet.addRow(["Month", "Bookings"]);
        dataSheet.getRow(dataSheet.rowCount).font = { bold: true };

        // Add data
        reportData.rawData.bookingReport.monthlyBookings.forEach((item) => {
          dataSheet.addRow([item.month, item.count]);
        });
      }

      // Monthly revenue data if available
      if (reportData.rawData.paymentReport && reportData.rawData.paymentReport.monthlyRevenue) {
        dataSheet.addRow([]);
        dataSheet.addRow(["Monthly Revenue Trends"]);
        dataSheet.getRow(dataSheet.rowCount).font = { bold: true };

        // Add headers
        dataSheet.addRow(["Month", "Revenue (NPR)"]);
        dataSheet.getRow(dataSheet.rowCount).font = { bold: true };

        // Add data
        reportData.rawData.paymentReport.monthlyRevenue.forEach((item) => {
          dataSheet.addRow([item.month, item.amount]);
        });
      }

      dataSheet.addRow([]);
      dataSheet.addRow([
        "Full data is available in JSON format for further processing.",
      ]);
    }

    // Return as buffer
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    throw error;
  }
}

module.exports = {
  previewReport,
  downloadReport,
};
