const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: {
          type: String,
          enum: ["image", "pdf", "other"],
          default: "other",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    submission: {
      attachments: [
        {
          fileName: String,
          fileUrl: String,
          fileType: {
            type: String,
            enum: ["image", "pdf", "other"],
            default: "other",
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      submittedAt: Date,
    },
    feedback: {
      content: String,
      grade: Number,
      attachments: [
        {
          fileName: String,
          fileUrl: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      providedAt: Date,
    },
    status: {
      type: String,
      enum: [
        "assigned",
        "submitted",
        "reviewed",
        "overdue",
      ],
      default: "assigned",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    feedbacknotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
