const bookingModel = require("./bookingModel");
const timeSlotModel = require("../timeSlots/timeSlotModel");
const userModel = require("../users/userModel");
const Notification = require("../notification/notificationModel");
const tutorModel = require("../tutors/tutorModel");
const createError = require("http-errors");
const Message = require("../message/messageModel");

// Step 1: Student creates booking request
const createBooking = async (req, res, next) => {
  const studentId = req.user.sub;
  const {
    tutorId,
    timeSlotId,
    specificTimeSlotId,
    startDate,
    duration,
    fee,
    totalAmount,
  } = req.body;

  try {
    // Check if the time slot exists and is available
    const timeSlot = await timeSlotModel.findOne({
      _id: timeSlotId,
      "timeSlots._id": specificTimeSlotId,
    });

    if (!timeSlot) {
      return next(createError(400, "Time slot not found"));
    }

    // Find the specific time slot and check if it's already booked
    const specificSlot = timeSlot.timeSlots.id(specificTimeSlotId);
    if (!specificSlot || specificSlot.isBooked) {
      return next(createError(400, "This time slot is not available"));
    }

    const tutor = await tutorModel.findById(tutorId);
    if (!tutor) {
      return next(createError(400, "Tutor not found"));
    }

    // Calculate end date
    const endDateCalculated = new Date(startDate);
    endDateCalculated.setMonth(endDateCalculated.getMonth() + duration);

    const booking = new bookingModel({
      studentId,
      tutorId,
      timeSlotId,
      specificTimeSlotId,
      startDate,
      endDate: endDateCalculated,
      duration,
      fee,
      totalAmount,
      teachingMode: tutor.teachingLocation,
      status: "pending",
      paymentStatus:
        tutor.teachingLocation === "online" ? "pending" : "pending",
    });

    specificSlot.isBooked = true;

    const notification = new Notification({
      recipient: tutorId,
      recipientModel: "Tutor",
      type: "booking",
      message: "You have a new booking request!",
      typeId: booking._id,
    });

    await notification.save();
    await booking.save();
    await timeSlot.save();

    const io = req.app.get("io");
    const userSocketMap = req.app.get("userSocketMap");
    if (userSocketMap.has(tutorId)) {
      let sockets = userSocketMap.get(tutorId);
      sockets.forEach((socketId) => {
        io.to(socketId).emit("newNotification", notification);
      });
    }

    res.status(201).json({
      StatusCode: 201,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Booking request created successfully",
        booking,
      },
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    return next(createError(500, "Server Error while creating booking"));
  }
};

const tutorConfirmBooking = async (req, res, next) => {
  const tutorId = req.user.sub;
  const { bookingId } = req.params;

  try {
    const booking = await bookingModel.findOne({
      _id: bookingId,
      tutorId,
      status: "pending",
    });

    if (!booking) {
      return next(createError(400, "Booking not found or already processed"));
    }

    if (booking.teachingMode === "online") {
      booking.status = "paymentPending";
    } else {
      booking.status = "ongoing";
      booking.paymentStatus = "pending";
    }

    const studentId = booking.studentId;

    const notification = new Notification({
      recipient: studentId,
      recipientModel: "User",
      type: "booking",
      message: "Your Booking request has been Confirmed!",
      typeId: booking._id,
    });

    await notification.save();
    await booking.save();

    const io = req.app.get("io");
    const userSocketMap = req.app.get("userSocketMap");
    const studentIDString = studentId.toString();
    if (userSocketMap.has(studentIDString)) {
      const studentSocketIDs = userSocketMap.get(studentIDString);
      studentSocketIDs.forEach((socketId) => {
        io.to(socketId).emit("newNotification", notification);
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message:
          booking.teachingMode === "online"
            ? "Booking confirmed, awaiting online payment"
            : "Booking confirmed, pending physical payment",
        booking,
      },
    });
  } catch (error) {
    console.error("Tutor Confirm Booking Error:", error);
    return next(createError(500, "Server Error while confirming booking"));
  }
};

const cancelBooking = async (req, res, next) => {
  const tutorId = req.user.sub;
  const { bookingId } = req.params;
  const { cancellationReason } = req.body;

  try {
    const booking = await bookingModel.findOne({
      _id: bookingId,
      tutorId,
      status: {
        $in: ["pending", "paymentPending"],
      },
      isActive: true,
    });

    if (!booking) {
      return next(createError(400, "Booking not found or cannot be cancelled"));
    }

    // Update booking status
    booking.status = "cancelled";
    booking.cancellationReason = cancellationReason;
    booking.isActive = false;

    // If the time slot was marked as booked, mark it as available again
    if (booking.timeSlotId && booking.specificTimeSlotId) {
      const timeSlot = await timeSlotModel.findById(booking.timeSlotId);
      if (timeSlot) {
        const specificSlot = timeSlot.timeSlots.id(booking.specificTimeSlotId);
        if (specificSlot) {
          specificSlot.isBooked = false;
          await timeSlot.save();
        }
      }
    }

    const studentId = booking.studentId;

    const notification = new Notification({
      recipient: studentId,
      recipientModel: "User",
      type: "booking",
      message: "Your Booking request has been Cancelled!",
      typeId: booking._id,
    });

    await notification.save();
    await booking.save();

    const io = req.app.get("io");
    const userSocketMap = req.app.get("userSocketMap");
    const studentIDString = studentId.toString();

    if (userSocketMap.has(studentIDString)) {
      const studentSocketIDs = userSocketMap.get(studentIDString);
      studentSocketIDs.forEach((socketId) => {
        io.to(socketId).emit("newNotification", notification);
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Booking cancelled successfully",
        booking,
      },
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    next(createError(500, "Server Error while cancelling booking"));
  }
};

const updatePhysicalPaymentStatus = async (req, res, next) => {
  const tutorId = req.user.sub;
  const { bookingId } = req.params;
  const { paymentStatus } = req.body;

  try {
    const booking = await bookingModel.findOne({
      _id: bookingId,
      tutorId,
      teachingMode: "physical",
      status: "ongoing",
    });

    if (!booking) {
      return next(
        createError(400, "Physical booking not found or not confirmed")
      );
    }

    if (!["pending", "completed", "failed"].includes(paymentStatus)) {
      return next(createError(400, "Invalid payment status"));
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: `Physical payment status updated to ${paymentStatus}`,
        booking,
      },
    });
  } catch (error) {
    console.error("Update Physical Payment Status Error:", error);
    next(createError(500, "Server Error while updating payment status"));
  }
};

const getStudentBookings = async (req, res, next) => {
  const studentId = req.user.sub;

  try {
    const bookings = await bookingModel
      .find({ studentId })
      .populate({
        path: "tutorId",
        model: "Tutor",
        select: "username email image teachingLocation",
      })
      .populate({
        path: "timeSlotId",
        model: "TimeSlot",
        select: "subjectName gradeLevel daysOfWeek timeSlots",
      })
      .sort({ updatedAt: -1 });

    if (!bookings.length) {
      return res.status(200).json({
        StatusCode: 200,
        IsSuccess: true,
        ErrorMessage: [],
        Result: {
          bookings: [],
        },
      });
    }

    const modifiedBookings = bookings.map((booking) => {
      const specificTimeSlot = booking.timeSlotId?.timeSlots?.find(
        (slot) => slot._id.toString() === booking.specificTimeSlotId.toString()
      );

      return {
        ...booking.toObject(),
        timeSlot: {
          startTime: specificTimeSlot?.startTime,
          endTime: specificTimeSlot?.endTime,
          days: booking.timeSlotId?.daysOfWeek || [],
        },
        timeSlotId: {
          ...booking.timeSlotId.toObject(),
          timeSlots: undefined,
        },
      };
    });

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        bookings: modifiedBookings,
      },
    });
  } catch (error) {
    console.error("Get Student Bookings Error:", error);
    next(createError(500, "Server Error while fetching bookings"));
  }
};

const getStudentChatBookings = async (req, res, next) => {
  const studentId = req.user.sub;

  try {
    const bookings = await bookingModel
      .find({ studentId })
      .populate({
        path: "tutorId",
        model: "Tutor",
        select: "username email image teachingLocation",
      })
      .populate({
        path: "timeSlotId",
        model: "TimeSlot",
        select: "subjectName gradeLevel daysOfWeek timeSlots",
      })
      .sort({ createdAt: 1 });

    if (!bookings.length) {
      return next(createError(400, "No bookings found"));
    }

    const firstBooking = bookings[0];
    const specificTimeSlot = firstBooking.timeSlotId?.timeSlots?.find(
      (slot) =>
        slot._id.toString() === firstBooking.specificTimeSlotId.toString()
    );

    const modifiedBooking = {
      ...firstBooking.toObject(),
      timeSlot: {
        startTime: specificTimeSlot?.startTime,
        endTime: specificTimeSlot?.endTime,
        days: firstBooking.timeSlotId?.daysOfWeek || [],
      },
      timeSlotId: {
        ...firstBooking.timeSlotId.toObject(),
        timeSlots: undefined,
      },
    };

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        bookings: [modifiedBooking],
      },
    });
  } catch (error) {
    console.error("Get Student Bookings Error:", error);
    return next(createError(500, "Server Error while fetching bookings"));
  }
};

const getTutorBookings = async (req, res, next) => {
  const tutorId = req.user.sub;

  try {
    const bookings = await bookingModel
      .find({ tutorId })
      .populate({
        path: "studentId",
        model: "User",
        select: "username image email grade",
      })
      .populate({
        path: "timeSlotId",
        model: "TimeSlot",
        select: "subjectName gradeLevel daysOfWeek timeSlots",
      })
      .sort({ updatedAt: -1 });

    if (!bookings.length) {
      return res.status(200).json({
        StatusCode: 200,
        IsSuccess: true,
        ErrorMessage: [],
        Result: {
          bookings: [],
        },
      });
    }

    const modifiedBookings = bookings.map((booking) => {
      const specificTimeSlot = booking.timeSlotId?.timeSlots?.find(
        (slot) => slot._id.toString() === booking.specificTimeSlotId.toString()
      );

      return {
        ...booking.toObject(),
        timeSlot: {
          startTime: specificTimeSlot?.startTime,
          endTime: specificTimeSlot?.endTime,
          days: booking.timeSlotId?.daysOfWeek || [],
        },
        timeSlotId: {
          ...booking.timeSlotId.toObject(),
          timeSlots: undefined,
        },
      };
    });

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        bookings: modifiedBookings,
      },
    });
  } catch (error) {
    console.error("Get Tutor Bookings Error:", error);
    return next(createError(500, "Server Error while fetching bookings"));
  }
};

const getTutorChatBookings = async (req, res, next) => {
  const tutorId = req.user.sub;

  try {
    const bookings = await bookingModel
      .find({ tutorId })
      .populate({
        path: "studentId",
        model: "User",
        select: "username image email grade",
      })
      .populate({
        path: "timeSlotId",
        model: "TimeSlot",
        select: "subjectName gradeLevel daysOfWeek timeSlots",
      })
      .sort({ createdAt: 1 });
    if (!bookings.length) {
      return res.status(200).json({
        StatusCode: 200,
        IsSuccess: true,
        ErrorMessage: [],
        Result: {
          bookings: [],
        },
      });
    }

    const firstBooking = bookings[0];
    const specificTimeSlot = firstBooking.timeSlotId?.timeSlots?.find(
      (slot) =>
        slot._id.toString() === firstBooking.specificTimeSlotId.toString()
    );

    const modifiedBooking = {
      ...firstBooking.toObject(),
      timeSlot: {
        startTime: specificTimeSlot?.startTime,
        endTime: specificTimeSlot?.endTime,
        days: firstBooking.timeSlotId?.daysOfWeek || [],
      },
      timeSlotId: {
        ...firstBooking.timeSlotId.toObject(),
        timeSlots: undefined,
      },
    };

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        bookings: [modifiedBooking],
      },
    });
  } catch (error) {
    console.error("Get Tutor Bookings Error:", error);
    next(createError(500, "Server Error while fetching bookings"));
  }
};

module.exports = {
  createBooking,
  tutorConfirmBooking,
  cancelBooking,
  updatePhysicalPaymentStatus,
  getStudentBookings,
  getStudentChatBookings,
  getTutorChatBookings,
  getTutorBookings,
};
