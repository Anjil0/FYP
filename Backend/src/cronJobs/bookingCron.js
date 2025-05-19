const cron = require("node-cron");
const Booking = require("../booking/bookingModel");
const TimeSlot = require("../timeSlots/timeSlotModel");
const Assignment = require("../assignments/assignmentsModel");

const updateBookingStatuses = () => {
  cron.schedule("* * * * *", async () => {
    console.log("🔍 Checking and updating booking statuses...");

    const now = new Date();

    try {
      // Handle expired pending bookings
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
      }

      // Handle expired ongoing bookings
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

          const allAssignments = await Assignment.find({
            bookingId: booking._id,
            status: { $in: ["ongoing", "submitted"] },
          });

          for (const assignment of allAssignments) {
            await Assignment.updateOne(
              { _id: assignment._id },
              { $set: { status: "completed" } }
            );
          }
          completedCount++;
        }

        console.log(
          `✅ Marked ${completedCount} ongoing bookings as completed.`
        );
      }

      // Remove specific time slots for completed or rated bookings
      const completedOrRatedBookings = await Booking.find({
        status: { $in: ["completed", "rated"] },
      });

      if (completedOrRatedBookings.length > 0) {
        let removedSlotsCount = 0;

        for (const booking of completedOrRatedBookings) {
          const { timeSlotId, specificTimeSlotId } = booking;

          // Remove the specific time slot from the time slot document
          if (specificTimeSlotId) {
            await Booking.updateOne(
              { _id: booking._id },
              { $unset: { specificTimeSlotId: "" } }
            );
            await TimeSlot.updateOne(
              { _id: timeSlotId },
              { $pull: { timeSlots: { _id: specificTimeSlotId } } }
            );
          }

          const allAssignments = await Assignment.find({
            bookingId: booking._id,
            status: { $in: ["ongoing", "submitted"] },
          });

          for (const assignment of allAssignments) {
            await Assignment.updateOne(
              { _id: assignment._id },
              { $set: { status: "completed" } }
            );
          }
          if (booking.isActive === true) {
            await Booking.updateOne(
              { _id: booking._id },
              { $set: { isActive: false } }
            );
          }

          removedSlotsCount++;
        }

        if (removedSlotsCount > 0) {
          console.log(
            `🗑️ Removed ${removedSlotsCount} specific time slots for completed or rated bookings.`
          );
        }
      }
    } catch (error) {
      console.error("❌ Error updating bookings and time slots:", error);
    }
  });
};

module.exports = updateBookingStatuses;
