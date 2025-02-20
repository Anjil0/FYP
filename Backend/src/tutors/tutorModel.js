const mongoose = require("mongoose");

const tutorModelSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    education: {
      type: String,
      required: true,
    },
    teachingExperience: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    teachingLocation: {
      type: String,
      enum: ["online", "physical"],
      required: true,
    },
    isVerified: {
      type: String,
      enum: ["verified", "pending", "rejected"],
      default: "pending",
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
    certificateImage: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["tutor"],
      default: "tutor",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpiresAt: { type: Date },
    resetPasswordCode: { type: String },
    resetPasswordCodeExpires: { type: Date },
    lastPasswordResetRequest: { type: Date, default: null },
  },
  { timestamps: true }
);

const tutorModel = mongoose.model("Tutor", tutorModelSchema);
module.exports = tutorModel;
