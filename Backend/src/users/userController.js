const createError = require("http-errors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./userModel");
const fs = require("fs");
const mongoose = require("mongoose");
const { uploadToCloudinary, getFilePath } = require("../utils/fileUpload");
const { generateAccessToken } = require("../utils/auth");
const { sendVerificationMail } = require("../config/mail");
const { sendPasswordResetEmail } = require("../config/mail");
const tutorModel = require("../tutors/tutorModel");

const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = async (req, res, next) => {
  const { username, email, password, grade, phoneNumber, address } = req.body;

  if (!username || !email || !password || !grade || !phoneNumber || !address) {
    const error = createError(400, "All fields are required.");
    return next(error);
  }

  if (!usernameRegex.test(username)) {
    const error = createError(
      400,
      "Username must be alphanumeric and between 3 to 20 characters long."
    );
    return next(error);
  }

  if (!emailRegex.test(email)) {
    const error = createError(400, "Invalid email format.");
    return next(error);
  }

  if (!passwordRegex.test(password)) {
    const error = createError(400, "Password must be strong!");
    return next(error);
  }

  if (!phoneRegex.test(phoneNumber)) {
    const error = createError(
      400,
      "Invalid phone number format. Must be 10 digits."
    );
    return next(error);
  }
  try {
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
      const error = createError(400, "Username is already taken.");
      return next(error);
    }

    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      const error = createError(400, "Email is already registered.");
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let imageUrl = "";
    if (req.file) {
      const imagePath = getFilePath(req.file.filename);
      const imageMimeType = req.file.mimetype.split("/").pop();
      imageUrl = await uploadToCloudinary(
        imagePath,
        "TutorEase/ProfileImages",
        req.file.filename,
        imageMimeType
      );
    }

    const verficationToken = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      grade,
      phoneNumber,
      address,
      verificationCode: verficationToken,
      verificationCodeExpiresAt,
      image: imageUrl,
    });

    await sendVerificationMail(newUser.email, verficationToken);

    const userObj = newUser.toObject();
    delete userObj.password;
    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "User registered successfully",
        user_data: userObj,
      },
    });
  } catch (error) {
    fs.unlinkSync(getFilePath(req.file.filename));
    next(createError(500, `Server Error while creating new user.${error}`));
  }
};

const verifyEmail = async (req, res, next) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return next(createError(400, "Email and verification code are required."));
  }

  try {
    const user = await userModel.findOne({ email });
    const tutor = user ? null : await tutorModel.findOne({ email });

    const account = user || tutor;

    if (!account) {
      return next(createError(400, "Account not found."));
    }

    if (account.isEmailVerified) {
      return next(createError(400, "Email is already verified."));
    }

    if (account.verificationCode !== verificationCode) {
      return next(createError(400, "Invalid verification code."));
    }

    if (new Date() > new Date(account.verificationCodeExpiresAt)) {
      return next(
        createError(
          400,
          "Verification code has expired. Please request a new one."
        )
      );
    }

    account.isEmailVerified = true;
    account.verificationCode = null;
    account.verificationCodeExpiresAt = null;
    await account.save();

    const accessToken = generateAccessToken(account._id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 30 * 60 * 1000,
    });

    const accountData = account.toObject();
    delete accountData.password;

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Email verified successfully!",
        accessToken: accessToken,
        account_data: accountData,
        userRole: account.role,
      },
    });
  } catch (error) {
    next(createError(500, "Error verifying email."));
  }
};

const resendVerificationCode = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(createError(400, "Email is required."));
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return next(createError(400, "User not found."));
    }

    if (user.isEmailVerified) {
      return next(createError(400, "Email is already verified."));
    }

    if (
      user.verificationCodeExpiresAt &&
      new Date() > new Date(user.verificationCodeExpiresAt)
    ) {
      user.verificationCode = null;
      user.verificationCodeExpiresAt = null;
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCodeExpiresAt = verificationCodeExpiresAt;
    user.verificationCode = verificationCode.toString();

    await user.save();

    await sendVerificationMail(user.email, verificationCode);

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message:
          "Verification code resent successfully. Please check your email.",
      },
    });
  } catch (error) {
    next(
      createError(500, `Error resending verification code.${error.message}`)
    );
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createError(400, "All fields are required!"));
  }

  try {
    let account = await userModel.findOne({ email });
    const isUser = Boolean(account);
    if (!account) {
      account = await tutorModel.findOne({ email });
    }

    if (!account) {
      return next(createError(400, "Account not found!"));
    }

    const passMatch = await bcrypt.compare(password, account.password);
    if (!passMatch) {
      return next(createError(400, "Incorrect email or password!"));
    }

    if (!account.isEmailVerified) {
      const verificationToken = generateVerificationCode();
      const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      account.verificationCode = verificationToken;
      account.verificationCodeExpiresAt = verificationCodeExpiresAt;

      await account.save();
      await sendVerificationMail(account.email, verificationToken);

      return res.status(403).json({
        StatusCode: 403,
        IsSuccess: false,
        ErrorMessage: [
          { message: "Email not verified. Verification email resent." },
        ],
        Result: {
          redirect: "/verify",
        },
      });
    }

    const accessToken = generateAccessToken(account._id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 30 * 60 * 1000,
    });

    const accountData = account.toObject();
    delete accountData.password;

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Login successful",
        accessToken: accessToken,
        userRole: account.role,
        account_data: accountData,
      },
    });
  } catch (error) {
    return next(createError(500, "Server error while logging in."));
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(createError(400, "Email is required"));
  }

  try {
    let account = await userModel.findOne({ email });
    if (!account) {
      account = await tutorModel.findOne({ email });
    }

    if (!account) {
      return next(createError(400, "No account found with this email address"));
    }

    if (
      account.lastPasswordResetRequest &&
      new Date() - new Date(account.lastPasswordResetRequest) < 15 * 60 * 1000
    ) {
      return next(
        createError(
          400,
          "A password reset request was recently made. Please try later."
        )
      );
    }

    const resetCode = generateVerificationCode();
    const resetCodeExpires = new Date(Date.now() + 3600000);

    account.resetPasswordCode = resetCode;
    account.resetPasswordCodeExpires = resetCodeExpires;
    account.lastPasswordResetRequest = new Date();
    await account.save();

    await sendPasswordResetEmail(account.email, resetCode);

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Password reset email sent. Please check your inbox.",
      },
    });
  } catch (error) {
    next(createError(500, `Error requesting password reset`, error.message));
  }
};

const resetPassword = async (req, res, next) => {
  const { resetCode, newPassword } = req.body;

  if (!newPassword) {
    return next(createError(400, "New password is required"));
  }

  try {
    let account = await userModel.findOne({ resetPasswordCode: resetCode });
    if (!account) {
      account = await tutorModel.findOne({ resetPasswordCode: resetCode });
    }

    if (!account) {
      return next(createError(400, "Reset code is invalid."));
    }

    if (new Date() > new Date(account.resetPasswordCodeExpires)) {
      return next(createError(400, "Reset link has expired"));
    }

    if (resetCode !== account.resetPasswordCode) {
      return next(createError(400, "Reset code is invalid"));
    }

    const isSamePassword = await bcrypt.compare(newPassword, account.password);
    if (isSamePassword) {
      return next(
        createError(400, "New password cannot be the same as the old password")
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    account.password = hashedPassword;
    account.resetPasswordCode = null;
    account.resetPasswordCodeExpires = null;
    await account.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      Result: {
        message: "Password has been reset successfully.",
      },
    });
  } catch (error) {
    next(createError(500, "Error resetting password"));
  }
};

const getUserDetails = async (req, res, next) => {
  const userId = req.user.sub;
  try {
    const userProfile = await userModel.findById(userId).select("-password");
    if (!userProfile) {
      return next(createError(404, "User not found"));
    }

    res.json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Successfully fetched user details",
        userData: userProfile,
      },
    });
  } catch (error) {
    next(
      createError(
        500,
        `Server error while fetching users Details. ${error.message}`
      )
    );
  }
};

const options = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
};

const handleLogout = async (req, res, next) => {
  try {
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 0,
    };

    res.clearCookie("accessToken", options);

    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        res.status(200).json({
          StatusCode: 200,
          IsSuccess: true,
          ErrorMessage: [],
          Result: {
            message: "Logout successful",
          },
        });
      });
    } else {
      res.status(200).json({
        StatusCode: 200,
        IsSuccess: true,
        ErrorMessage: [],
        Result: {
          message: "Logout successful",
        },
      });
    }
  } catch (error) {
    next(createError(500, `Server error while logging out. ${error.message}`));
  }
};

const toggleRole = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await userModel.findById(id);
    if (!user) {
      return next(createError(400, "User not found."));
    }
    user.role = user.role === "admin" ? "user" : "admin";

    const userObj = user.toObject();
    delete userObj.password;
    await user.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: `Role changed to ${user.role} successfully`,
        data: userObj,
      },
    });
  } catch (error) {
    return next(
      createError(
        500,
        `Server error while changing user role to admin: ${error.message}`
      )
    );
  }
};

const verifyResetLink = async (req, res, next) => {
  const { code } = req.params;

  if (!code) {
    return next(createError(400, "Reset code is required"));
  }

  try {
    let account = await userModel.findOne({
      resetPasswordCode: code,
      resetPasswordCodeExpires: { $gt: new Date() },
    });

    if (!account) {
      account = await tutorModel.findOne({
        resetPasswordCode: code,
        resetPasswordCodeExpires: { $gt: new Date() },
      });
    }

    if (!account) {
      return next(createError(400, "Invalid or expired reset link"));
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Valid reset code",
      },
    });
  } catch (error) {
    next(createError(500, "Error verifying reset code"));
  }
};

const updateUserDetails = async (req, res, next) => {
  const userId = req.user.sub;
  const { username, grade, phoneNumber, address } = req.body;

  if (!username || !grade || !phoneNumber || !address) {
    return next(createError(400, "All fields are required"));
  }

  if (!usernameRegex.test(username)) {
    return next(
      createError(
        400,
        "Username must be alphanumeric and between 3 to 20 characters long."
      )
    );
  }

  if (!phoneRegex.test(phoneNumber)) {
    return next(
      createError(400, "Invalid phone number format. Must be 10 digits.")
    );
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return next(createError(400, "User not found"));
    }

    user.username = username;
    user.grade = grade;
    user.phoneNumber = phoneNumber;
    user.address = address;
    await user.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "User details updated successfully",
        userData: user,
      },
    });
  } catch (error) {
    next(
      createError(500, `Server error while updating user details. ${error}`)
    );
  }
};

module.exports = {
  registerUser,
  resendVerificationCode,
  verifyEmail,
  forgotPassword,
  resetPassword,
  verifyResetLink,
  loginUser,
  handleLogout,
  getUserDetails,
  toggleRole,
  updateUserDetails,
};
