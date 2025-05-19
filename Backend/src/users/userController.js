const createError = require("http-errors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./userModel");
const fs = require("fs");
const mongoose = require("mongoose");
const {
  uploadToCloudinary,
  getFilePath,
  extractPublicId,
} = require("../utils/fileUpload");
const { generateAccessToken } = require("../utils/auth");
const { sendVerificationMail } = require("../config/mail");
const { sendPasswordResetEmail } = require("../config/mail");
const tutorModel = require("../tutors/tutorModel");
const paymentModel = require("../payment/paymentModel");
const bookingModel = require("../booking/bookingModel");

const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = async (req, res, next) => {
  const {
    username,
    email,
    password,
    grade,
    phoneNumber,
    address,
    preferredSubjects,
  } = req.body;

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

  let normalizedPreferredSubjects = preferredSubjects;

  if (!Array.isArray(normalizedPreferredSubjects)) {
    if (
      typeof normalizedPreferredSubjects === "string" &&
      normalizedPreferredSubjects.trim() !== ""
    ) {
      normalizedPreferredSubjects = [normalizedPreferredSubjects];
    } else {
      return next(
        createError(400, "At least one preferred subject is required.")
      );
    }
  }

  if (normalizedPreferredSubjects.length < 1) {
    return next(
      createError(400, "At least one preferred subject is required.")
    );
  }

  if (!phoneRegex.test(phoneNumber)) {
    const error = createError(
      400,
      "Invalid phone number format. Must be 10 digits."
    );
    return next(error);
  }

  try {
    // Check for existing username or email in userModel
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

    const existingTutor = await tutorModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingTutor) {
      const error = createError(
        400,
        "The user is already registered as a tutor."
      );
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
      preferredSubjects: normalizedPreferredSubjects,
      verificationCode: verficationToken,
      verificationCodeExpiresAt,
      image: imageUrl,
    });

    // Send verification email
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
    if (req.file) fs.unlinkSync(getFilePath(req.file.filename));
    next(createError(500, `Server Error while creating new user. ${error}`));
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
      return next(createError(400, "Incorrect email or password!"));
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
  const { username, grade, phoneNumber, address, preferredSubjects } = req.body;

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

  let normalizedPreferredSubjects = preferredSubjects;

  if (!Array.isArray(normalizedPreferredSubjects)) {
    if (
      typeof normalizedPreferredSubjects === "string" &&
      normalizedPreferredSubjects.trim() !== ""
    ) {
      normalizedPreferredSubjects = [normalizedPreferredSubjects];
    } else {
      return next(
        createError(400, "At least one preferred subject is required.")
      );
    }
  }

  if (normalizedPreferredSubjects.length < 1) {
    return next(
      createError(400, "At least one preferred subject is required.")
    );
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return next(createError(400, "User not found"));
    }

    if (req.file) {
      if (user.image) {
        const publicId = extractPublicId(user.image, "image");
        await cloudinary.uploader.destroy(publicId);
      }

      const imagePath = getFilePath(req.file.filename);
      const imageMimeType = req.file.mimetype.split("/").pop();
      imageUrl = await uploadToCloudinary(
        imagePath,
        "TutorEase/ProfileImages",
        req.file.filename,
        imageMimeType
      );
      user.image = imageUrl;
    }

    user.username = username;
    user.grade = grade;
    user.phoneNumber = phoneNumber;
    user.address = address;
    user.preferredSubjects = normalizedPreferredSubjects;
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

/**
 * Get admin dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    // Get current date and calculate start of previous month
    const currentDate = new Date();
    const previousMonthDate = new Date();
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

    const startOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const startOfPreviousMonth = new Date(
      previousMonthDate.getFullYear(),
      previousMonthDate.getMonth(),
      1
    );

    // Stats counts
    const totalUsers = await userModel.countDocuments({ role: 'user' });
    const activeTutors = await tutorModel.countDocuments({
      isVerified: "verified",
    });
    const pendingVerifications = await tutorModel.countDocuments({
      isVerified: "pending",
    });

    // Previous month stats for growth calculation
    const previousMonthUsers = await userModel.countDocuments({
      createdAt: { $lt: startOfCurrentMonth },
    });

    const previousMonthTutors = await tutorModel.countDocuments({
      isVerified: "verified",
      createdAt: { $lt: startOfCurrentMonth },
    });

    const previousMonthVerifications = await tutorModel.countDocuments({
      isVerified: "pending",
      createdAt: { $lt: startOfCurrentMonth },
    });

    // Calculate monthly revenue from payments
    const monthlyRevenue = await paymentModel
      .aggregate([
        {
          $match: {
            status: "COMPLETED",
            createdAt: { $gte: startOfCurrentMonth, $lte: currentDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .then((result) => (result.length > 0 ? result[0].total : 0));

    const previousMonthRevenue = await paymentModel
      .aggregate([
        {
          $match: {
            status: "COMPLETED",
            createdAt: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .then((result) => (result.length > 0 ? result[0].total : 0));

    // Calculate growth rates
    const userGrowthRate =
      previousMonthUsers > 0
        ? Math.round(
            ((totalUsers - previousMonthUsers) / previousMonthUsers) * 100
          )
        : 100;

    const tutorGrowthRate =
      previousMonthTutors > 0
        ? Math.round(
            ((activeTutors - previousMonthTutors) / previousMonthTutors) * 100
          )
        : 100;

    const verificationChangeRate =
      previousMonthVerifications > 0
        ? Math.round(
            ((pendingVerifications - previousMonthVerifications) /
              previousMonthVerifications) *
              100
          )
        : 0;

    const revenueGrowthRate =
      previousMonthRevenue > 0
        ? Math.round(
            ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
              100
          )
        : 100;

    // Get revenue data for the last 6 months
    const revenueData = await getRevenueData(6);

    // Get user growth data for the last 6 months
    const userGrowthData = await getUserGrowthData(6);

    // Get booking status distribution
    const bookingStatusData = await getBookingStatusDistribution();

    // Get tutor gender distribution
    const genderDistribution = await getTutorGenderDistribution();

    // Get teaching mode distribution
    const teachingModeData = await getTeachingModeDistribution();

    // Get recent activities
    const recentActivities = await getRecentActivities(10);

    // Get recent users
    const recentUsers = await getRecentUsers(6);

    // Get recent bookings
    const recentBookings = await getRecentBookings(5);

    // Send response
    res.status(200).json({
      stats: {
        totalUsers,
        activeTutors,
        monthlyRevenue,
        pendingVerifications,
        userGrowthRate,
        tutorGrowthRate,
        verificationChangeRate,
        revenueGrowthRate,
      },
      revenueData,
      userGrowthData,
      bookingStatusData,
      genderDistribution,
      teachingModeData,
      recentActivities,
      recentUsers,
      recentBookings,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    res
      .status(500)
      .json({ message: "Error fetching dashboard data", error: error.message });
  }
};

/**
 * Get revenue data for the specified number of months
 * @param {Number} months - Number of months to fetch data for
 * @returns {Array} Monthly revenue data
 */
async function getRevenueData(months) {
  const result = [];
  const currentDate = new Date();

  // Generate month names and initialize revenue data
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    const monthName = date.toLocaleString("default", { month: "short" });

    result.push({
      month: monthName,
      value: 0,
    });
  }

  // Calculate start date (months ago from now)
  const startDate = new Date();
  startDate.setMonth(currentDate.getMonth() - (months - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // Fetch revenue data from database
  const revenueData = await paymentModel.aggregate([
    {
      $match: {
        status: "COMPLETED",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Map database results to our formatted array
  revenueData.forEach((item) => {
    const date = new Date(item._id.year, item._id.month - 1);
    const monthName = date.toLocaleString("default", { month: "short" });

    const index = result.findIndex((r) => r.month === monthName);
    if (index !== -1) {
      result[index].value = item.total;
    }
  });

  return result;
}

/**
 * Get user growth data for the specified number of months
 * @param {Number} months - Number of months to fetch data for
 * @returns {Array} Monthly user growth data
 */
async function getUserGrowthData(months) {
  const result = [];
  const currentDate = new Date();

  // Generate month names and initialize data structure
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    const monthName = date.toLocaleString("default", { month: "short" });

    result.push({
      month: monthName,
      students: 0,
      tutors: 0,
    });
  }

  // Calculate start date (months ago from now)
  const startDate = new Date();
  startDate.setMonth(currentDate.getMonth() - (months - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // Fetch student growth data
  const studentData = await userModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Fetch tutor growth data
  const tutorData = await tutorModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Map student data to our result
  studentData.forEach((item) => {
    const date = new Date(item._id.year, item._id.month - 1);
    const monthName = date.toLocaleString("default", { month: "short" });

    const index = result.findIndex((r) => r.month === monthName);
    if (index !== -1) {
      result[index].students = item.count;
    }
  });

  // Map tutor data to our result
  tutorData.forEach((item) => {
    const date = new Date(item._id.year, item._id.month - 1);
    const monthName = date.toLocaleString("default", { month: "short" });

    const index = result.findIndex((r) => r.month === monthName);
    if (index !== -1) {
      result[index].tutors = item.count;
    }
  });

  return result;
}

/**
 * Get booking status distribution
 * @returns {Array} Booking status distribution
 */
async function getBookingStatusDistribution() {
  const statusData = await bookingModel.aggregate([
    {
      $group: {
        _id: "$status",
        value: { $sum: 1 },
      },
    },
  ]);

  // Format the data for the chart
  return statusData.map((item) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.value,
  }));
}

/**
 * Get tutor gender distribution
 * @returns {Array} Tutor gender distribution
 */
async function getTutorGenderDistribution() {
  const genderData = await tutorModel.aggregate([
    {
      $group: {
        _id: "$gender",
        value: { $sum: 1 },
      },
    },
  ]);

  // Format the data for the chart
  return genderData.map((item) => ({
    gender: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.value,
  }));
}

/**
 * Get teaching mode distribution
 * @returns {Array} Teaching mode distribution
 */
async function getTeachingModeDistribution() {
  // Get tutors by teaching location
  const tutorData = await tutorModel.aggregate([
    {
      $group: {
        _id: "$teachingLocation",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get bookings by teaching mode
  const bookingData = await bookingModel.aggregate([
    {
      $group: {
        _id: "$teachingMode",
        count: { $sum: 1 },
      },
    },
  ]);

  // Format the data for the chart
  const result = [
    { type: "Online", tutors: 0, bookings: 0 },
    { type: "Physical", tutors: 0, bookings: 0 },
  ];

  tutorData.forEach((item) => {
    if (item._id === "online") {
      result[0].tutors = item.count;
    } else if (item._id === "physical") {
      result[1].tutors = item.count;
    }
  });

  bookingData.forEach((item) => {
    if (item._id === "online") {
      result[0].bookings = item.count;
    } else if (item._id === "physical") {
      result[1].bookings = item.count;
    }
  });

  return result;
}

/**
 * Get recent activities
 * @param {Number} limit - Number of activities to fetch
 * @returns {Array} Recent activities
 */
async function getRecentActivities(limit) {
  const activities = [];

  // Recent tutor registrations
  const tutorRegistrations = await tutorModel
    .find()
    .sort({ createdAt: -1 })
    .limit(Math.floor(limit / 4))
    .lean();

  tutorRegistrations.forEach((tutor) => {
    activities.push({
      type: "registration",
      action: "New Tutor Registration",
      detail: tutor.username,
      time: getTimeAgo(tutor.createdAt),
      status: tutor.isVerified === "verified" ? "completed" : "pending",
    });
  });

  // Recent student registrations
  const studentRegistrations = await userModel
    .find()
    .sort({ createdAt: -1 })
    .limit(Math.floor(limit / 4))
    .lean();

  studentRegistrations.forEach((user) => {
    activities.push({
      type: "registration",
      action: "New Student Registration",
      detail: user.username,
      time: getTimeAgo(user.createdAt),
      status: "completed",
    });
  });

  // Recent payments
  const payments = await paymentModel
    .find()
    .sort({ createdAt: -1 })
    .limit(Math.floor(limit / 4))
    .lean();

  payments.forEach((payment) => {
    activities.push({
      type: "payment",
      action: "Payment Received",
      detail: `NPR ${payment.amount.toLocaleString()}`,
      time: getTimeAgo(payment.createdAt),
      status: payment.status.toLowerCase(),
    });
  });

  // Recent bookings
  const bookings = await bookingModel
    .find()
    .sort({ createdAt: -1 })
    .limit(Math.floor(limit / 4))
    .populate("studentId", "username")
    .lean();

  bookings.forEach((booking) => {
    activities.push({
      type: "booking",
      action: "New Booking Request",
      detail: booking.studentId
        ? booking.studentId.username
        : "Unknown Student",
      time: getTimeAgo(booking.createdAt),
      status: booking.status,
    });
  });

  // Sort by time (createdAt)
  return activities
    .sort((a, b) => {
      const timeA = parseTimeAgo(a.time);
      const timeB = parseTimeAgo(b.time);
      return timeA - timeB;
    })
    .slice(0, limit);
}

/**
 * Parse time ago string to minutes for sorting
 * @param {String} timeAgo - Time ago string (e.g. "2 minutes ago")
 * @returns {Number} Minutes
 */
function parseTimeAgo(timeAgo) {
  const [value, unit] = timeAgo.split(" ");

  if (unit.includes("second")) return parseInt(value);
  if (unit.includes("minute")) return parseInt(value) * 60;
  if (unit.includes("hour")) return parseInt(value) * 60 * 60;
  if (unit.includes("day")) return parseInt(value) * 60 * 60 * 24;
  if (unit.includes("week")) return parseInt(value) * 60 * 60 * 24 * 7;
  if (unit.includes("month")) return parseInt(value) * 60 * 60 * 24 * 30;

  return 0;
}

/**
 * Get recent users
 * @param {Number} limit - Number of users to fetch
 * @returns {Array} Recent users
 */
async function getRecentUsers(limit) {
  // Combine students and tutors
  const recentUsers = [];

  // Get recent students
  const students = await userModel
    .find()
    .sort({ createdAt: -1 })
    .limit(limit / 2)
    .lean();

  students.forEach((student) => {
    recentUsers.push({
      name: student.username,
      email: student.email,
      role: student.role === "user" ? "student" : "admin",
      image: student.image,
      joined: formatDate(student.createdAt),
    });
  });

  // Get recent tutors
  const tutors = await tutorModel
    .find()
    .sort({ createdAt: -1 })
    .limit(limit / 2)
    .lean();

  tutors.forEach((tutor) => {
    recentUsers.push({
      name: tutor.username,
      email: tutor.email,
      role: "tutor",
      image: tutor.image,
      joined: formatDate(tutor.createdAt),
    });
  });

  // Sort by joined date
  return recentUsers
    .sort((a, b) => {
      return new Date(b.joined) - new Date(a.joined);
    })
    .slice(0, limit);
}

/**
 * Get recent bookings
 * @param {Number} limit - Number of bookings to fetch
 * @returns {Array} Recent bookings
 */
async function getRecentBookings(limit) {
  const bookings = await bookingModel
    .find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("studentId", "username email image")
    .populate("tutorId", "username image")
    .lean();

  return bookings.map((booking) => {
    const startDate = new Date(booking.startDate);

    return {
      studentName: booking.studentId
        ? booking.studentId.username
        : "Unknown Student",
      studentEmail: booking.studentId ? booking.studentId.email : "",
      studentImage: booking.studentId ? booking.studentId.image : null,
      tutorName: booking.tutorId ? booking.tutorId.username : "Unknown Tutor",
      tutorImage: booking.tutorId ? booking.tutorId.image : null,
      date: formatDate(startDate),
      time: startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      amount: booking.totalAmount,
      status: booking.status,
    };
  });
}

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @returns {String} Formatted date
 */
function formatDate(date) {
  const d = new Date(date);
  const month = d.toLocaleString("default", { month: "short" });
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format time ago string
 * @param {Date} date - Date to format
 * @returns {String} Time ago string
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return Math.floor(seconds) + " seconds ago";
}

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
  getAdminDashboard,
};
