const mongoose = require("mongoose");

const userModelSchema = new mongoose.Schema(
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
    preferredSubjects: [{ type: String }],
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
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

const UserModel = mongoose.model("User", userModelSchema);
module.exports = UserModel;
