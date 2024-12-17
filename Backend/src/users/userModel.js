const mongoose = require("mongoose");

const userModelSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
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
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordCode: { type: String },
    resetPasswordCodeExpires: { type: Date },
    lastPasswordResetRequest: { type: Date, default: null },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userModelSchema);
module.exports = UserModel;
