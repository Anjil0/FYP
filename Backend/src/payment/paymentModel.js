// models/khaltiPaymentModel.js
const mongoose = require("mongoose");

const KhaltiPaymentSchema = new mongoose.Schema(
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
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    pidx: {
      type: String,
      unique: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: { type: String, enum: ["Khalti"], required: true },
    status: {
      type: String,
      enum: ["COMPLETED", "PENDING", "CANCELLED", "FAILED"],
      default: "PENDING",
      uppercase: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const KhaltiPayment = mongoose.model("KhaltiPayment", KhaltiPaymentSchema);

module.exports = KhaltiPayment;
