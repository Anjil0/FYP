const createError = require("http-errors");
const ratingModel = require("./ratingModel");
const bookingModel = require("../booking/bookingModel");
const Notification = require("../notification/notificationModel");

const giveRating = async (req, res, next) => {
  const studentId = req.user.sub;
  const { bookingId, rating, review } = req.body;

  try {
    const booking = await bookingModel
      .findOne({
        _id: bookingId,
        studentId,
        status: "completed",
      })
      .populate("studentId", "username");

    if (!booking) {
      return next(
        createError(400, "Rating can only be given for completed bookings")
      );
    }

    // Create new rating
    const newRating = new ratingModel({
      studentId,
      tutorId: booking.tutorId,
      bookingId,
      rating,
      review,
    });
    await newRating.save();

    booking.status = "rated";
    await booking.save();

    // Create notification for the tutor
    const notification = new Notification({
      recipient: booking.tutorId,
      recipientModel: "Tutor",
      type: "rating",
      message: `You have received a new rating of ${rating} stars! from ${booking.studentId.username}`,
      typeId: newRating._id,
    });

    console.log(notification);
    await notification.save();

    // Emit real-time notification to tutor
    const io = req.app.get("io");
    const userSocketMap = req.app.get("userSocketMap");

    const tutorIdStr = booking.tutorId.toString();
    if (userSocketMap.has(tutorIdStr)) {
      let sockets = userSocketMap.get(tutorIdStr);

      sockets.forEach((socketId) => {
        io.to(socketId).emit("newNotification", notification);
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Rating submitted successfully",
        rating: newRating,
      },
    });
  } catch (error) {
    console.log(error.message);
    next(createError(500, "Server error while submitting rating"));
  }
};

const getRatings = async (req, res, next) => {
  const bookingId = req.params.bookingId;

  try {
    const ratings = await ratingModel
      .findOne({
        bookingId,
      })
      .populate("studentId", "username")
      .populate("tutorId", "username");

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        ratings,
      },
    });
  } catch (error) {
    next(createError(500, "Server error while fetching ratings"));
  }
};

const getRatingsByTutorId = async (req, res, next) => {
  try {
    const tutorId = req.params.id;

    const ratings = await ratingModel.find({ tutorId });
    // Calculate the average rating
    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const avgRating =
      totalRatings > 0 ? (sumRatings / totalRatings).toFixed(2) : 0;

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        avgRating,
        totalRatings,
        ratings,
      },
    });
  } catch (error) {
    console.error("Error fetching ratings:", error.message);
    next(createError(500, "Server error while fetching ratings"));
  }
};

const getAllRatings = async (req, res, next) => {
  try {
    // Aggregate ratings grouped by tutorId
    const ratingsData = await ratingModel.aggregate([
      {
        $group: {
          _id: "$tutorId",
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "tutor",
        },
      },
      {
        $unwind: "$tutor",
      },
      {
        $project: {
          tutorId: "$_id",
          tutorName: "$tutor.username",
          avgRating: { $round: ["$avgRating", 2] },
          totalRatings: 1,
        },
      },
    ]);

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: ratingsData,
    });
  } catch (error) {
    console.error("Error fetching all ratings:", error.message);
    next(createError(500, "Server error while fetching all ratings"));
  }
};

module.exports = { giveRating, getRatings, getRatingsByTutorId, getAllRatings };
