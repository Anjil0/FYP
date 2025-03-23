const express = require("express");
const assignmentRouter = express.Router();
const {
  authenticateToken,
  isTutor,
  isUser,
  isAdmin,
} = require("../middlewares/authHandle");

const upload = require("../middlewares/multerConfig");

const assignmentController = require("./assignmentsController");

// the tutor can upload image and pdf , 1 also or both also
assignmentRouter.post(
  "/createAssignments",
  authenticateToken,
  isTutor,
  upload.fields([{ name: "files", maxCount: 3 }]),
  assignmentController.createAssignment
);

// // Get all assignments for a student
// assignmentRouter.get(
//   "/getStudentAssignments/",
//   authenticateToken,
//   isUser,
//   assignmentController.getStudentAssignments
// );

// Get all assignments for a Opne student of a specific tutor
assignmentRouter.get(
  "/getOpenAssignments/:tutorID",
  authenticateToken,
  isUser,
  assignmentController.getOpenAssignments
);

// Get all assignments for a Closed student of a specific tutor
assignmentRouter.get(
  "/getClosedAssignments/:tutorID",
  authenticateToken,
  isUser,
  assignmentController.getClosedAssignments
);

// Get all assignments created by a tutor
assignmentRouter.get(
  "/getTutorAssignments/",
  authenticateToken,
  assignmentController.getTutorAssignments
);

// Get assignments for a specific booking
assignmentRouter.get(
  "/getBookingAssignments/:bookingId",
  authenticateToken,
  assignmentController.getBookingAssignments
);

// Get a specific assignment by ID
assignmentRouter.get(
  "/getSpecificAssignment/:assignmentId",
  authenticateToken,
  assignmentController.getAssignmentById
);

// Update assignment details (tutor only)
assignmentRouter.put(
  "/updateAssignment/:assignmentId",
  authenticateToken,
  upload.fields([{ name: "files", maxCount: 3 }]),
  assignmentController.updateAssignment
);

// Submit an assignment (student only)
assignmentRouter.post(
  "/submitAssignment/:assignmentId",
  authenticateToken,
  upload.fields([{ name: "files", maxCount: 3 }]),
  assignmentController.submitAssignment
);

// Provide feedback on an assignment (tutor only)
assignmentRouter.post(
  "/feedback/:assignmentId",
  authenticateToken,
  isTutor,
  assignmentController.provideFeedback
);

// Delete an attachment both Student and tutor
assignmentRouter.delete(
  "/deleteAssignmentsAttachments/:assignmentId/:attachmentId",
  authenticateToken,
  assignmentController.deleteAttachment
);

// Delete an assignment (tutor only)
assignmentRouter.delete(
  "/deleteAssignments/:assignmentId",
  authenticateToken,
  assignmentController.deleteAssignment
);

module.exports = assignmentRouter;
