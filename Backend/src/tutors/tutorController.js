const createError = require("http-errors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tutorModel = require("./tutorModel");
const cloudinary = require("../config/coludinary");
const {
  uploadToCloudinary,
  getFilePath,
  extractPublicId,
} = require("../utils/fileUpload");
const {
  sendVerificationMail,
  sendTutorVerificationReject,
  sendTutorMailVerified,
} = require("../config/mail");
const userModel = require("../users/userModel");
const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const signupTutor = async (req, res, next) => {
  const {
    username,
    email,
    password,
    age,
    gender,
    grade,
    phoneNumber,
    address,
    education,
    teachingExperience,
    description,
    teachingLocation,
  } = req.body;

  try {
    const userExists = await userModel.findOne({ email });
    if (userExists) {
      return next(
        createError(400, "Email is already registered as a Student.")
      );
    }

    const tutorExists = await tutorModel.findOne({ email });
    if (tutorExists) {
      return next(createError(400, "Email is already registered."));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!req.files) {
      return next(createError(400, "Image and certificateImage are required."));
    }
    
    let imageUrl = "";
    if (req.files.image) {
      const imagePath = getFilePath(req.files.image[0].filename);
      imageUrl = await uploadToCloudinary(
        imagePath,
        "TutorEase/ProfileImages",
        req.files.image[0].filename,
        "image"
      );
    }

    let certificateImageUrl = "";
    if (req.files.certificateImage) {
      const certificatePath = getFilePath(
        req.files.certificateImage[0].filename
      );
      certificateImageUrl = await uploadToCloudinary(
        certificatePath,
        "TutorEase/CertificateImages",
        req.files.certificateImage[0].filename,
        "image"
      );
    }

    const verficationToken = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const tutor = new tutorModel({
      username,
      email,
      password: hashedPassword,
      age,
      gender,
      grade,
      phoneNumber,
      address,
      education,
      teachingExperience,
      description,
      teachingLocation,
      image: imageUrl,
      certificateImage: certificateImageUrl,
      verificationCode: verficationToken,
      verificationCodeExpiresAt,
    });

    await tutor.save();

    await sendVerificationMail(tutor.email, verficationToken);

    const tutorObj = tutor.toObject();
    delete tutorObj.password;

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Tutor registered successfully",
        tutor_data: tutorObj,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    next(createError(500, "Server Error while signing up tutor."));
  }
};

const getAllTutors = async (req, res, next) => {
  try {
    const tutors = await tutorModel.find().select("-password");
    if (!tutors) {
      return next(createError(400, "No tutors found."));
    }

    return res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        tutors,
      },
    });
  } catch (error) {
    console.error("Get All Tutors Error:", error);
    next(createError(500, "Server Error while fetching unverified tutors."));
  }
};

const getVerifiedTutors = async (req, res, next) => {
  try {
    // Step 2: Continue aggregation
    const tutors = await tutorModel.aggregate([
      {
        $match: {
          isEmailVerified: true,
          isVerified: "verified",
        },
      },
      {
        $lookup: {
          from: "ratings",
          localField: "_id",
          foreignField: "tutorId",
          as: "ratings",
        },
      },
      {
        $addFields: {
          averageRating: {
            $ifNull: [
              {
                $avg: {
                  $map: {
                    input: "$ratings",
                    as: "rating",
                    in: "$$rating.rating",
                  },
                },
              },
              0, // Default rating if no ratings exist
            ],
          },
        },
      },
      {
        $project: {
          password: 0,
          ratings: 0,
        },
      },
    ]);

    if (!tutors || tutors.length === 0) {
      return next(createError(400, "No tutors found."));
    }

    return res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        tutors,
      },
    });
  } catch (error) {
    console.error("Get Verified Tutors Error:", error);
    next(createError(500, "Server Error while fetching verified tutors."));
  }
};

const getTutorProfile = async (req, res, next) => {
  const id = req.user.sub;
  try {
    const tutor = await tutorModel.findById(id).select("-password");
    if (!tutor) {
      return next(createError(404, "Tutor not found."));
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        tutor,
      },
    });
  } catch (error) {
    console.error("Get Tutor Details Error:", error);
    next(createError(500, "Server Error while fetching tutor details."));
  }
};

const getTutorDetails = async (req, res, next) => {
  const { id } = req.params;
  try {
    const tutor = await tutorModel.findById(id).select("-password");
    if (!tutor) {
      return next(createError(404, "Tutor not found."));
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        tutor,
      },
    });
  } catch (error) {
    console.error("Get Tutor Details Error:", error);
    next(createError(500, "Server Error while fetching tutor details."));
  }
};

const toogleAvailability = async (req, res, next) => {
  const userId = req.user.sub;
  try {
    const tutor = await tutorModel.findById(userId);
    if (!tutor) {
      return next(createError(400, "Tutor not found."));
    }

    tutor.isAvailable = !tutor.isAvailable;
    await tutor.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Availability status updated successfully",
        tutor,
      },
    });
  } catch (error) {
    console.error("Toogle Availability Error:", error);
    next(createError(500, "Server Error while toogling availability."));
  }
};

const verifyTutor = async (req, res, next) => {
  const { id } = req.params;
  const { action } = req.body;
  try {
    const tutor = await tutorModel.findById(id);
    if (!tutor) {
      return next(createError(404, "Tutor not found."));
    }

    tutor.isVerified = action;
    if (tutor.isVerified === "rejected") {
      await sendTutorVerificationReject(tutor.email, tutor.username);
    } else {
      await sendTutorMailVerified(tutor.email, tutor.username);
    }
    await tutor.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Tutor verification status updated successfully",
        tutor,
      },
    });
  } catch (error) {
    console.error("Verify Tutor Error:", error);
    next(createError(500, "Server Error while verifying tutor."));
  }
};

const getTutorDashboard = async (req, res, next) => {
  const userId = req.user.sub;
  try {
    const tutor = await tutorModel
      .findById(userId)
      .select("username isAvailable");
    if (!tutor) {
      return next(createError(404, "Tutor not found."));
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        tutor,
      },
    });
  } catch (error) {
    console.error("Get Tutor Dashboard Error:", error);
    next(createError(500, "Server Error while fetching tutor dashboard."));
  }
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
    const [users, tutors] = await Promise.all([
      userModel.find().skip(skip).limit(limit).select("-password"),
      tutorModel.find().skip(skip).limit(limit).select("-password"),
    ]);

    const totalUsers =
      (await userModel.countDocuments()) + (await tutorModel.countDocuments());
    const totalPages = Math.ceil(totalUsers / limit);

    if (!totalUsers) {
      return next(createError(400, `No users available`));
    }

    if (page > totalPages) {
      return next(createError(400, `Invalid Page Number`));
    }

    const formattedUsers = {
      users: users,
      tutors: tutors,
    };

    const currentPageSize = users.length + tutors.length;

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

const updateTutorProfile = async (req, res, next) => {
  const tutorId = req.user.sub;
  const {
    username,
    grade,
    phoneNumber,
    address,
    teachingExperience,
    education,
    description,
    age,
    gender,
  } = req.body;

  // Basic validation
  if (!username || !grade || !phoneNumber || !address) {
    return next(
      createError(
        400,
        "Username, grade, phone number, and address are required"
      )
    );
  }

  // Validate username format
  if (!usernameRegex.test(username)) {
    return next(
      createError(
        400,
        "Username must be alphanumeric and between 3 to 20 characters long."
      )
    );
  }

  // Validate phone number format
  if (!phoneRegex.test(phoneNumber)) {
    return next(
      createError(400, "Invalid phone number format. Must be 10 digits.")
    );
  }

  try {
    // Find tutor in database
    const tutor = await tutorModel.findById(tutorId);
    if (!tutor) {
      return next(createError(404, "Tutor not found"));
    }

    // Handle image upload if file was provided
    if (req.file) {
      // Delete previous image from Cloudinary if exists
      if (tutor.image) {
        const publicId = extractPublicId(
          tutor.image,
          "TutorEase/ProfileImages"
        );
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      // Upload new image to Cloudinary
      const imagePath = getFilePath(req.file.filename);
      const imageMimeType = req.file.mimetype.split("/").pop();
      const imageUrl = await uploadToCloudinary(
        imagePath,
        "TutorEase/ProfileImages",
        req.file.filename,
        imageMimeType
      );

      tutor.image = imageUrl;
    }

    // Update tutor fields
    tutor.username = username;
    tutor.grade = grade;
    tutor.phoneNumber = phoneNumber;
    tutor.address = address;
    tutor.description = description || tutor.description;
    tutor.education = education || tutor.education;
    tutor.teachingExperience = teachingExperience || tutor.teachingExperience;

    if (age) tutor.age = age;
    if (gender) tutor.gender = gender;

    await tutor.save();

    // exclude password from tutor
    const tutorResponse = tutor.toObject();
    delete tutorResponse.password;

    // Return success response
    return res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Tutor profile updated successfully",
        tutor: tutorResponse,
      },
    });
  } catch (error) {
    next(
      createError(
        500,
        `Server error while updating tutor profile. ${error.message}`
      )
    );
  }
};

// Phone number regex for validation
const phoneRegex = /^\d{10}$/;
// Username regex for validation
const usernameRegex = /^[a-zA-Z0-9 ]{3,20}$/;

module.exports = {
  signupTutor,
  verifyTutor,
  getAllTutors,
  toogleAvailability,
  getVerifiedTutors,
  getTutorDetails,
  updateTutorProfile,
  getTutorProfile,
  getAllUsers,
  getTutorDashboard,
};
