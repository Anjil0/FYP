// models/messageModel.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return !this.imageUrl;
      },
      trim: true,
    },
    imageUrl: {
      type: String,
      required: function () {
        return !this.content;
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ bookingId: 1 });
messageSchema.index({ lastMessageAt: -1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
