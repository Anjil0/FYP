const Assignment = require("./assignmentsModel");
const Booking = require("../booking/bookingModel");
const createError = require("http-errors");
const cloudinary = require("../config/coludinary");

const {
  uploadToCloudinary,
  getFilePath,
  extractPublicId,
} = require("../utils/fileUpload");
const { assign } = require("nodemailer/lib/shared");

// Create a new assignment (tutor only)
const createAssignment = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { bookingId, title, description, dueDate, subject } = req.body;

    // Verify the booking exists and belongs to this tutor
    const booking = await Booking.findOne({
      _id: bookingId,
      tutorId: userId,
    });

    if (!booking) {
      return next(createError(404, "Booking not found"));
    }

    // Process uploaded files
    let processedAttachments = [];
    if (req.files && req.files.files) {
      // Handle files uploaded through multer
      const uploadedFiles = req.files.files;

      // Process each file
      for (const file of uploadedFiles) {
        // Validate file type
        const fileExt = file.originalname.split(".").pop().toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "gif", "bmp"].includes(fileExt);
        const isPdf = fileExt === "pdf";

        if (!isImage && !isPdf) {
          return next(createError(400, "Only image and PDF files are allowed"));
        }

        // Upload to Cloudinary
        const filePath = getFilePath(file.filename);

        const fileType = isImage ? "image" : "raw";
        const folder = isImage
          ? "TutorEase/AssignmentImages"
          : "TutorEase/AssignmentFiles";

        const fileUrl = await uploadToCloudinary(
          filePath,
          folder,
          file.originalname,
          fileType
        );

        // Add to processed attachments
        processedAttachments.push({
          fileName: file.originalname,
          fileUrl: fileUrl,
          fileType: isImage ? "image" : "pdf",
          uploadedAt: new Date(),
        });
      }
    }

    // Handle attachments sent as JSON in the request body
    if (req.body.attachments) {
      let attachmentsArray = [];
      try {
        attachmentsArray = JSON.parse(req.body.attachments);
      } catch (e) {
        // If it's already an array, no need to parse
        if (Array.isArray(req.body.attachments)) {
          attachmentsArray = req.body.attachments;
        }
      }

      if (Array.isArray(attachmentsArray) && attachmentsArray.length > 0) {
        // Validate and add any attachments sent as JSON
        const jsonAttachments = attachmentsArray.map((attachment) => {
          const fileExt = attachment.fileName.split(".").pop().toLowerCase();
          const isImage = ["jpg", "jpeg", "png", "gif", "bmp"].includes(
            fileExt
          );
          const isPdf = fileExt === "pdf";

          if (!isImage && !isPdf) {
            throw new Error("Only image and PDF files are allowed");
          }

          return {
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileType: isImage ? "image" : "pdf",
            uploadedAt: new Date(),
          };
        });

        processedAttachments = [...processedAttachments, ...jsonAttachments];
      }
    }

    console.log(dueDate);

    const newAssignment = new Assignment({
      bookingId,
      tutorId: userId,
      studentId: booking.studentId,
      title,
      description,
      dueDate,
      subject,
      attachments: processedAttachments,
      status: "assigned",
    });

    await newAssignment.save();

    res.status(201).json({
      StatusCode: 201,
      IsSuccess: true,
      ErrorMessage: [],
      Result: newAssignment,
    });
  } catch (error) {
    console.error("Create Assignment Error:", error);
    if (error.message === "Only image and PDF files are allowed") {
      return next(createError(400, error.message));
    }
    next(createError(500, "Server error while creating assignment"));
  }
};

// Update assignment details (tutor only)
const updateAssignment = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { assignmentId } = req.params;
    const { title, description, dueDate } = req.body;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      tutorId: userId,
      isActive: true,
    });

    if (!assignment) {
      return next(
        createError(404, "Assignment not found or you don't have permission")
      );
    }

    // Only allow updates if the assignment hasn't been submitted yet
    if (
      assignment.status === "submitted" ||
      assignment.status === "reviewed" ||
      assignment.status === "completed"
    ) {
      return next(
        createError(400, "Cannot update assignment after submission")
      );
    }

    // Process uploaded files
    let processedAttachments = [];
    if (req.files && req.files.files) {
      // Handle files uploaded through multer
      const uploadedFiles = req.files.files;

      // Process each file
      for (const file of uploadedFiles) {
        // Validate file type
        const fileExt = file.originalname.split(".").pop().toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "gif", "bmp"].includes(fileExt);
        const isPdf = fileExt === "pdf";

        if (!isImage && !isPdf) {
          return next(createError(400, "Only image and PDF files are allowed"));
        }

        // Upload to Cloudinary
        const filePath = getFilePath(file.filename);

        const fileType = isImage ? "image" : "raw";
        const folder = isImage
          ? "TutorEase/AssignmentImages"
          : "TutorEase/AssignmentFiles";

        const fileUrl = await uploadToCloudinary(
          filePath,
          folder,
          file.originalname,
          fileType
        );

        // Add to processed attachments
        processedAttachments.push({
          fileName: file.originalname,
          fileUrl: fileUrl,
          fileType: isImage ? "image" : "pdf",
          uploadedAt: new Date(),
        });
      }
    }

    // Handle attachments sent as JSON in the request body
    if (req.body.attachments) {
      let attachmentsArray = [];
      try {
        attachmentsArray = JSON.parse(req.body.attachments);
      } catch (e) {
        // If it's already an array, no need to parse
        if (Array.isArray(req.body.attachments)) {
          attachmentsArray = req.body.attachments;
        }
      }

      if (Array.isArray(attachmentsArray) && attachmentsArray.length > 0) {
        // Validate and add any attachments sent as JSON
        const jsonAttachments = attachmentsArray.map((attachment) => {
          const fileExt = attachment.fileName.split(".").pop().toLowerCase();
          const isImage = ["jpg", "jpeg", "png", "gif", "bmp"].includes(
            fileExt
          );
          const isPdf = fileExt === "pdf";

          if (!isImage && !isPdf) {
            throw new Error("Only image and PDF files are allowed");
          }

          return {
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileType: isImage ? "image" : "pdf",
            uploadedAt: new Date(),
          };
        });

        processedAttachments = [...processedAttachments, ...jsonAttachments];
      }
    }

    // Update basic assignment details
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.dueDate = dueDate || assignment.dueDate;

    // Update attachments if any new files were processed
    if (processedAttachments.length > 0) {
      // Determine how to handle attachments
      if (req.body.replaceAttachments === "true") {
        // Replace all existing attachments
        assignment.attachments = processedAttachments;
      } else {
        // Append new attachments to existing ones
        assignment.attachments = [
          ...assignment.attachments,
          ...processedAttachments,
        ];
      }
    }

    await assignment.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignment,
    });
  } catch (error) {
    console.error("Update Assignment Error:", error);
    if (error.message === "Only image and PDF files are allowed") {
      return next(createError(400, error.message));
    }
    next(createError(500, "Server error while updating assignment"));
  }
};

// Get all assignments created by a tutor
const getTutorAssignments = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { status } = req.query;

    const query = { tutorId: userId, isActive: true };

    if (status) {
      query.status = status;
    }

    const assignments = await Assignment.find(query)
      .populate("studentId", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignments,
    });
  } catch (error) {
    console.error("Get Tutor Assignments Error:", error);
    next(createError(500, "Server error while fetching assignments"));
  }
};

// // Get all assignments for a student
// const getStudentAssignments = async (req, res, next) => {
//   try {
//     const userId = req.user?.sub;
//     const { status } = req.query;

//     const query = { studentId: userId, isActive: true };

//     if (status) {
//       query.status = status;
//     }

//     const assignments = await Assignment.find(query)
//       .populate("tutorId", "username profilePicture")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       StatusCode: 200,
//       IsSuccess: true,
//       ErrorMessage: [],
//       Result: assignments,
//     });
//   } catch (error) {
//     console.error("Get Student Assignments Error:", error);
//     next(createError(500, "Server error while fetching assignments"));
//   }
// };

// Get allAssignmentBySpecificTutor - Opened
const getOpenAssignments = async (req, res, next) => {
  try {
    const userId = req.user?.sub;

    const { tutorID } = req.params;
    const query = {
      studentId: userId,
      tutorId: tutorID,
      isActive: true,
      status: { $in: ["assigned", "submitted"] },
    };

    const assignments = await Assignment.find(query)
      .populate("studentId", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignments,
    });
  } catch (error) {
    console.error("Get All Assignment By Specific Tutor Error:", error);
    next(createError(500, "Server error while fetching assignments"));
  }
};

// Get allAssignmentBySpecificTutor - Closed
const getClosedAssignments = async (req, res, next) => {
  try {
    const userId = req.user?.sub;

    const { tutorID } = req.params;
    const query = {
      studentId: userId,
      tutorId: tutorID,
      isActive: true,
      status: { $in: ["overdue", "unsubmitted", "completed"] },
    };

    const assignments = await Assignment.find(query)
      .populate("studentId", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignments,
    });
  } catch (error) {
    console.error("Get All Closed Assignment Tutor Error:", error);
    next(createError(500, "Server error while fetching assignments"));
  }
};

// Get assignments for a specific booking
const getBookingAssignments = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { bookingId } = req.params;

    if (!userId) {
      return next(createError(401, "Unauthorized access"));
    }

    // Verify the booking belongs to this user (either as student or tutor)
    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ studentId: userId }, { tutorId: userId }],
    });

    if (!booking) {
      return next(
        createError(404, "Booking not found or you don't have permission")
      );
    }

    const assignments = await Assignment.find({
      bookingId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignments,
    });
  } catch (error) {
    console.error("Get Booking Assignments Error:", error);
    next(createError(500, "Server error while fetching assignments"));
  }
};

// Get a specific assignment by ID
const getAssignmentById = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { assignmentId } = req.params;

    if (!userId) {
      return next(createError(401, "Unauthorized access"));
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      $or: [{ studentId: userId }, { tutorId: userId }],
      isActive: true,
    })
      .populate("studentId", "username profilePicture")
      .populate("tutorId", "username profilePicture");

    if (!assignment) {
      return next(
        createError(404, "Assignment not found or you don't have permission")
      );
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignment,
    });
  } catch (error) {
    console.error("Get Assignment By ID Error:", error);
    next(createError(500, "Server error while fetching assignment"));
  }
};

// Submit an assignment (student only)
const submitAssignment = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { assignmentId } = req.params;
    const { remarks } = req.body;

    // Find the assignment
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      studentId: userId,
      isActive: true,
    });

    if (!assignment) {
      return next(createError(404, "Assignment not found or access denied"));
    }

    // Check if the assignment is overdue
    const now = new Date();
    const isOverdue = now > new Date(assignment.dueDate);

    // Process file uploads from req.files
    let processedAttachments = [];
    if (req.files && req.files.files) {
      for (const file of req.files.files) {
        // Validate file type
        const fileExt = file.originalname.split(".").pop().toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "gif", "bmp"].includes(fileExt);
        const isPdf = fileExt === "pdf";

        if (!isImage && !isPdf) {
          return next(createError(400, "Only image and PDF files are allowed"));
        }

        // Upload to Cloudinary
        const filePath = getFilePath(file.filename);

        const fileType = isImage ? "image" : "raw";
        const folder = isImage
          ? "TutorEase/AssignmentSubmissionsImages/"
          : "TutorEase/AssignmentSubmissionsFiles/";

        const fileUrl = await uploadToCloudinary(
          filePath,
          folder,
          file.originalname,
          fileType
        );

        // Add to processed attachments
        processedAttachments.push({
          fileName: file.originalname,
          fileUrl: fileUrl,
          fileType: isImage ? "image" : "pdf",
          uploadedAt: new Date(),
        });
      }
    }

    // Update assignment with submission details
    assignment.submission = {
      remarks: remarks || "",
      attachments: processedAttachments,
      submittedAt: now,
    };

    // Update assignment status
    assignment.status = isOverdue ? "overdue" : "submitted";

    await assignment.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignment,
    });
  } catch (error) {
    console.error("Submit Assignment Error:", error);
    if (error.message === "Only image and PDF files are allowed") {
      return next(createError(400, error.message));
    }
    next(createError(500, "Server error while submitting assignment"));
  }
};

// Provide feedback on an assignment (tutor only)
const provideFeedback = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { assignmentId } = req.params;
    const { content, grade } = req.body;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      tutorId: userId,
    });

    if (!assignment) {
      return next(
        createError(404, "Assignment not found or you don't have permission")
      );
    }

    // Can only provide feedback if the assignment has been submitted
    if (
      (assignment.status !== "completed") &
      (assignment.status !== "reviewed")
    ) {
      return next(
        createError(
          400,
          "Cannot provide feedback on an assignment that hasn't been submitted"
        )
      );
    }

    assignment.feedback = {
      content,
      grade,
      providedAt: new Date(),
    };

    assignment.status = "reviewed";

    await assignment.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignment,
    });
  } catch (error) {
    console.error("Provide Feedback Error:", error);
    next(createError(500, "Server error while providing feedback"));
  }
};

// Delete an attachment
const deleteAttachment = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { assignmentId, attachmentId } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      $or: [{ studentId: userId }, { tutorId: userId }],
      isActive: true,
    });

    if (!assignment) {
      return next(
        createError(404, "Assignment not found or you don't have permission")
      );
    }

    let attachmentToDelete = null;

    // Check if user is tutor and deleting from assignment attachments
    if (assignment.tutorId.toString() === userId) {
      attachmentToDelete = assignment.attachments.find(
        (attachment) => attachment._id.toString() === attachmentId
      );

      assignment.attachments = assignment.attachments.filter(
        (attachment) => attachment._id.toString() !== attachmentId
      );
    }
    // Check if user is student and deleting from submission attachments
    else if (
      assignment.studentId.toString() === userId &&
      assignment.submission
    ) {
      attachmentToDelete = assignment.submission.attachments.find(
        (attachment) => attachment._id.toString() === attachmentId
      );

      assignment.submission.attachments =
        assignment.submission.attachments.filter(
          (attachment) => attachment._id.toString() !== attachmentId
        );
    } else {
      return next(
        createError(403, "You don't have permission to delete this attachment")
      );
    }

    // If the attachment exists, delete it from Cloudinary
    if (attachmentToDelete) {
      const publicId = extractPublicId(
        attachmentToDelete.fileUrl,
        attachmentToDelete.fileType
      );
      await cloudinary.uploader.destroy(publicId);
    }

    await assignment.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: assignment,
    });
  } catch (error) {
    console.error("Delete Attachment Error:", error);
    next(createError(500, "Server error while deleting attachment"));
  }
};

// Delete an assignment (tutor only)
const deleteAssignment = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { assignmentId } = req.params;

    if (!userId) {
      return next(createError(401, "Unauthorized access"));
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      tutorId: userId,
    });

    if (!assignment) {
      return next(
        createError(404, "Assignment not found or you don't have permission")
      );
    }

    // Soft delete by setting isActive to false
    assignment.isActive = false;
    await assignment.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: { message: "Assignment deleted successfully" },
    });
  } catch (error) {
    console.error("Delete Assignment Error:", error);
    next(createError(500, "Server error while deleting assignment"));
  }
};

module.exports = {
  createAssignment,
  // getStudentAssignments,
  getTutorAssignments,
  getBookingAssignments,
  getAssignmentById,
  updateAssignment,
  submitAssignment,
  provideFeedback,
  getOpenAssignments,
  getClosedAssignments,
  deleteAttachment,
  deleteAssignment,
};
