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
  upload.fields([{ name: "files", maxCount: 3 }]),
  assignmentController.createAssignment
);

// Get all assignments for a student
assignmentRouter.get(
  "/getStudentAssignments/",
  authenticateToken,
  assignmentController.getStudentAssignments
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
// the Student can also upload image or pdf while submitting, 1 also or both also
assignmentRouter.post(
  "/submitAssignment/:assignmentId",
  authenticateToken,
  assignmentController.submitAssignment
);

// Provide feedback on an assignment (tutor only)
assignmentRouter.post(
  "/feedback/:assignmentId",
  authenticateToken,
  assignmentController.provideFeedback
);

// Upload attachment to an assignment
assignmentRouter.post(
  "/uploadAssignmentsattachment/:assignmentId",
  authenticateToken,
  assignmentController.uploadAttachment
);

// Delete an attachment
assignmentRouter.delete(
  "/deleteAssignmentsAttachments/:assignmentId/:attachmentId",
  authenticateToken,
  assignmentController.deleteAttachment
);

// Change assignment status
assignmentRouter.patch(
  "/changeStatusAssignments/:assignmentId",
  authenticateToken,
  assignmentController.updateStatus
);

// Delete an assignment (tutor only)
assignmentRouter.delete(
  "/deleteAssignments/:assignmentId",
  authenticateToken,
  assignmentController.deleteAssignment
);

module.exports = assignmentRouter;
