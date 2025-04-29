const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    timeSlots: [
      {
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
        isBooked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    daysOfWeek: [
      {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        required: true,
      },
    ],
    timezone: {
      type: String,
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    gradeLevel: {
      type: String,
      required: true,
    },
    sessionType: {
      type: String,
    },
    notes: {
      type: String,
    },
    fee: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

timeSlotSchema.index({ tutor: 1, isActive: 1 });
timeSlotSchema.index({ subjectName: 1 });
timeSlotSchema.index({ createdAt: -1 });

const timeSlotModel = mongoose.model("TimeSlot", timeSlotSchema);
module.exports = timeSlotModel;
