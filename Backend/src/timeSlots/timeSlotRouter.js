const express = require("express");
const timeSlotRouter = express.Router();
const {
  authenticateToken,
  isAdmin,
  isTutor,
} = require("../middlewares/authHandle");

const {
  createTimeSlot,
  getAllTimeSlots,
  deleteTimeSlot,
  deleteSpecificTimeSlot,
  updatedTimeSlot,
} = require("./timeSlotController");

timeSlotRouter.post(
  "/createTimeSlot",
  authenticateToken,
  isTutor,
  createTimeSlot
);

timeSlotRouter.get(
  "/getAllTimeSlots",
  authenticateToken,
  isTutor,
  getAllTimeSlots
);

timeSlotRouter.get("/getAllTimeSlots/:tutorId", getAllTimeSlots);

timeSlotRouter.put(
  "/updateTimeSlot/:slotId",
  authenticateToken,
  isTutor,
  updatedTimeSlot
);

timeSlotRouter.delete(
  "/deleteTimeSlot/:slotId",
  authenticateToken,
  isTutor,
  deleteTimeSlot
);

timeSlotRouter.delete(
  "/deleteSpecificTimeSlot/:slotId/:timeSlotId",
  authenticateToken,
  isTutor,
  deleteSpecificTimeSlot
);

module.exports = timeSlotRouter;
