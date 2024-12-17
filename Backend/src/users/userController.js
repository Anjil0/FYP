const createError = require("http-errors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./userModel");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../src/utils/auth");
const config = require("../src/config/config");
const mongoose = require("mongoose");
const { uploadToCloudinary, getFilePath } = require("../src/utils/fileUpload");

const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerUser = async (req, res, next) => {
  const { fullname, username, email, password } = req.body;

  if (!fullname || !username || !email || !password) {
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
        "profile-images",
        req.file.filename,
        imageMimeType
      );
    }
    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      image: imageUrl,
    });

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
    next(createError(500, "Server Error while creating new user."));
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createError(400, "All fields are required!"));
  }

  try {
    let user = await userModel.findOne({ email });
    let isNewUser = false;

    if (!user) {
      let partner = await partnerModel.findOne({ email });
      if (partner) {
        if (partner.status === "active") {
          user = partner;
          isPartner = true;
        } else {
          return next(
            createError(400, "Partner must be Verified by administrator!")
          );
        }
      }
    }

    if (!user) {
      return next(createError(400, "User or Partner not found!"));
    }

    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return next(createError(400, "Incorrect email and password!"));
    }

    if (!user.lastLogin) {
      isNewUser = true;
    }

    user.lastLogin = new Date();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 30 * 60 * 1000,
    });

    try {
      await user.save();
    } catch (error) {
      console.log(error);
      return next(createError(500, "Error saving user/partner after login."));
    }

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: isNewUser
          ? "Welcome, new user! Login Successful"
          : "Login Successfully",
        accessToken: accessToken,
        refreshToken: refreshToken,
        user_data: {
          ...userObj,
          progress: user.progress,
          isPartner: isPartner,
          isNewUser: isNewUser,
        },
      },
    });
  } catch (error) {
    return next(createError(500, "Server error while login."));
  }
};

const refreshAccessToken = async (req, res, next) => {
  const incomingRefreshToken = req.body.refreshToken;
  if (!incomingRefreshToken) {
    return next(
      createError(400, "Unauthorized request: No refresh token provided")
    );
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, config.refreshTokenSecret);
  } catch (error) {
    return next(createError(400, "Invalid access token"));
  }

  const userId = decodedToken.sub;

  const newAccessToken = generateAccessToken(userId);

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 30 * 60 * 1000,
  });

  res.status(200).json({
    accessToken: newAccessToken,
  });
};

const getAllUsers = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (limit > 10) {
    return res.status(400).json({
      StatusCode: 400,
      IsSuccess: false,
      ErrorMessage: "Limit cannot exceed more than 10",
    });
  }
  const skip = (page - 1) * limit;

  try {
    const users = await userModel.aggregate([
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          fullname: 1,
          role: 1,
          username: 1,
          flagCaptured: 1,
          Level: 1,
        },
      },
    ]);

    const totalUsers = await userModel.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    if (!totalUsers) {
      return next(createError(400, `No users available`));
    }

    if (page > totalPages) {
      return next(createError(400, `Invalid Page Number`));
    }

    const formattedUsers = {
      users: users.filter((user) => user.role !== "admin"),
      admin: users.filter((user) => user.role === "admin"),
    };

    const currentPageSize = users.length;

    res.json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Successfully fetched all users",
        data: formattedUsers,
        pagination: {
          totalUsers,
          totalPages,
          currentPage: page,
          pageSize: currentPageSize,
        },
      },
    });
  } catch (error) {
    return next(
      createError(500, `Server error while fetching users. ${error.message}`)
    );
  }
};

const getUserDetails = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const userProfile = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          username: 1,
          country: 1,
          Level: 1,
          Rank: 1,
          solvedQuizzes: 1,
          image: 1,
        },
      },
      {
        $lookup: {
          from: "questions",
          localField: "solvedQuizzes",
          foreignField: "quiz._id",
          as: "solvedQuizzes",
        },
      },
      {
        $lookup: {
          from: "topics",
          localField: "solvedQuizzes.topic",
          foreignField: "_id",
          as: "topics",
        },
      },
      {
        $addFields: {
          topics: {
            $map: {
              input: "$topics",
              as: "topic",
              in: {
                _id: "$$topic._id",
                topic: "$$topic.topic",
                description: "$$topic.description",
                difficulty: "$$topic.difficulty",
                totalQuizzes: {
                  $size: {
                    $filter: {
                      input: "$solvedQuizzes",
                      as: "quiz",
                      cond: { $eq: ["$$quiz.topic", "$$topic._id"] },
                    },
                  },
                },
                solvedQuizIds: {
                  $size: {
                    $filter: {
                      input: "$solvedQuizzes",
                      as: "quiz",
                      cond: {
                        $and: [
                          { $eq: ["$$quiz.topic", "$$topic._id"] },
                          { $in: ["$$quiz._id", "$solvedQuizzes._id"] },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          completedTopics: {
            $size: {
              $filter: {
                input: "$topics",
                as: "topic",
                cond: {
                  $eq: ["$$topic.solvedQuizIds", "$$topic.totalQuizzes"],
                },
              },
            },
          },
        },
      },
      { $unset: "topics" },
      { $unset: "solvedQuizzes" },
    ]);

    if (!userProfile || userProfile.length === 0) {
      return next(createError(404, "User not found"));
    }

    res.json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Successfully fetched user details",
        userData: userProfile[0],
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
    res.clearCookie("refreshToken", options);
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

const getUserById = async (req, res, next) => {
  const userId = req.params.id;
  try {
    const user = await userModel.findById(userId);
    const userObj = user.toObject();
    delete userObj.password;

    if (!user) {
      return next(createError(400, "User not found."));
    }
    res.json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "User fetched successfully",
        user_data: userObj,
      },
    });
  } catch (error) {
    return next(createError(500, "Server error while fetch user by ID."));
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

module.exports = {
  registerUser,
  loginUser,
  handleLogout,
  getAllUsers,
  getUserDetails,
  getUserById,
  refreshAccessToken,
  toggleRole,
};
