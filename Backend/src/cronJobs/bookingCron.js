const cron = require("node-cron");
const Booking = require("../booking/bookingModel");

const updateBookingStatuses = () => {
  // Schedule cron job to run every minute
  cron.schedule("* * * * *", async () => {
    console.log("🔍 Checking and updating booking statuses...");

    const now = new Date();

    try {
      const expiredPendingBookings = await Booking.find({
        endDate: { $lt: now },
        status: { $in: ["pending", "paymentPending"] },
      });

      if (expiredPendingBookings.length > 0) {
        let cancelledCount = 0;

        for (const booking of expiredPendingBookings) {
          await Booking.updateOne(
            { _id: booking._id },
            { $set: { status: "cancelled", isActive: false } }
          );
          cancelledCount++;
        }

        console.log(
          `❌ Cancelled ${cancelledCount} expired bookings that were pending or paymentPending.`
        );
      } else {
        console.log("✅ No expired bookings to cancel.");
      }

      const expiredOngoingBookings = await Booking.find({
        endDate: { $lt: now },
        status: "ongoing",
      });

      if (expiredOngoingBookings.length > 0) {
        let completedCount = 0;

        for (const booking of expiredOngoingBookings) {
          await Booking.updateOne(
            { _id: booking._id },
            { $set: { status: "completed", isActive: false } }
          );
          completedCount++;
        }

        console.log(
          `✅ Marked ${completedCount} ongoing bookings as completed.`
        );
      } else {
        console.log("✅ No ongoing bookings to mark as completed.");
      }
    } catch (error) {
      console.error("❌ Error updating bookings:", error);
    }
  });
};

module.exports = updateBookingStatuses;
