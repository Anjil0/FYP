const tutorModel = require("../tutors/tutorModel");
const createError = require("http-errors");
const timeSlotModel = require("./timeSlotModel");

const createTimeSlot = async (req, res, next) => {
  const {
    timeSlots,
    daysOfWeek,
    timezone,
    subjectName,
    gradeLevel,
    notes,
    fee,
  } = req.body;
  const tutorId = req.user.sub;

  try {
    if (
      !timeSlots ||
      !daysOfWeek ||
      !timezone ||
      !subjectName ||
      !gradeLevel ||
      !fee
    ) {
      return next(createError(400, "All required fields must be provided."));
    }

    // Validate fee is a positive number
    if (typeof fee !== "number" || fee <= 0) {
      return next(createError(400, "Fee must be a positive number."));
    }

    const tutor = await tutorModel.findOne({ _id: tutorId });
    if (!tutor) {
      return next(createError(400, "Tutor not found."));
    }

    const newTimeSlot = new timeSlotModel({
      createdBy: tutorId,
      timeSlots,
      daysOfWeek,
      timezone,
      subjectName,
      gradeLevel,
      sessionType: tutor.teachingLocation,
      notes,
      fee,
      isActive: true,
    });

    await newTimeSlot.save();

    res.status(201).json({
      StatusCode: 201,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Time slot created successfully",
        timeSlotData: newTimeSlot,
      },
    });
  } catch (error) {
    console.error("Time Slot Creation Error:", error);
    next(createError(500, "Server error while creating time slot."));
  }
};

const getAllTimeSlots = async (req, res, next) => {
  let tutorId = req.params.tutorId || req.user?.sub;

  try {
    const timeSlots = await timeSlotModel.find({ createdBy: tutorId });
    if (!timeSlots) {
      return next(createError(400, "No time slots found."));
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        timeSlots,
      },
    });
  } catch (error) {
    console.error("Get All Time Slots Error:", error);
    next(createError(500, "Server Error while fetching time slots."));
  }
};

const deleteTimeSlot = async (req, res, next) => {
  const tutorId = req.user.sub;
  const { slotId } = req.params;

  try {
    const timeSlot = await timeSlotModel.findOne({
      _id: slotId,
      createdBy: tutorId,
    });

    if (!timeSlot) {
      return next(createError(400, "Time slot not found."));
    }

    const hasBookedSlots = timeSlot.timeSlots.some((slot) => slot.isBooked);

    if (hasBookedSlots) {
      return next(
        createError(
          400,
          "Cannot delete time slot as it contains booked sessions"
        )
      );
    }

    await timeSlotModel.findByIdAndDelete(slotId);

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Time slot deleted successfully",
        deletedSlotId: slotId,
      },
    });
  } catch (error) {
    console.error("Delete Time Slot Error:", error);
    return next(createError(500, "Server Error while deleting time slot."));
  }
};

const deleteSpecificTimeSlot = async (req, res, next) => {
  const tutorId = req.user.sub;
  const { slotId, timeSlotId } = req.params;

  try {
    const timeSlot = await timeSlotModel.findOne({
      _id: slotId,
      createdBy: tutorId,
    });

    if (!timeSlot) {
      return next(createError(400, "Time slot not found."));
    }

    const specificTimeSlot = timeSlot.timeSlots.id(timeSlotId);

    if (!specificTimeSlot) {
      return next(createError(400, "Specific time slot not found."));
    }

    if (specificTimeSlot.isBooked) {
      return next(createError(400, "Cannot delete a booked time slot."));
    }

    timeSlot.timeSlots = timeSlot.timeSlots.filter(
      (slot) => slot._id.toString() !== timeSlotId
    );

    if (timeSlot.timeSlots.length === 0) {
      await timeSlotModel.findByIdAndDelete(slotId);
      return next(
        createError(400, "Time slot document deleted as no slots remained")
      );
    }

    await timeSlot.save();

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Individual time slot deleted successfully",
        updatedTimeSlot: timeSlot,
      },
    });
  } catch (error) {
    console.error("Delete Individual Time Slot Error:", error);
    return next(
      createError(500, "Server Error while deleting individual time slot.")
    );
  }
};

const updatedTimeSlot = async (req, res, next) => {
  const tutorId = req.user.sub;
  const { slotId } = req.params;
  const {
    timeSlots,
    timezone,
    subjectName,
    gradeLevel,
    notes,
    daysOfWeek,
    fee,
  } = req.body;

  try {
    const existingTimeSlot = await timeSlotModel.findOne({
      _id: slotId,
      createdBy: tutorId,
    });

    if (!existingTimeSlot) {
      return next(createError(404, "Time slot not found."));
    }

    // Check if any slots are booked
    const bookedSlots = existingTimeSlot.timeSlots.filter(
      (slot) => slot.isBooked
    );

    if (bookedSlots.length > 0) {
      // If there are booked slots:
      // 1. Verify no booked slots are being removed
      const hasRemovedBookedSlots = bookedSlots.some((bookedSlot) => {
        return !timeSlots.some(
          (newSlot) =>
            newSlot.startTime === bookedSlot.startTime &&
            newSlot.endTime === bookedSlot.endTime
        );
      });

      if (hasRemovedBookedSlots) {
        return next(createError(400, "Cannot remove booked time slots."));
      }

      // 2. Check if any other details are being modified
      if (
        timezone !== existingTimeSlot.timezone ||
        subjectName !== existingTimeSlot.subjectName ||
        gradeLevel !== existingTimeSlot.gradeLevel ||
        notes !== existingTimeSlot.notes ||
        fee !== existingTimeSlot.fee ||
        JSON.stringify(daysOfWeek.sort()) !==
          JSON.stringify(existingTimeSlot.daysOfWeek.sort())
      ) {
        return next(
          createError(
            400,
            "Cannot modify subject, grade, timezone, fee, notes, or days when slots are booked."
          )
        );
      }

      // 3. Only update the time slots, preserving booked ones
      const updatedTimeSlots = timeSlots.map((newSlot) => {
        const existingBookedSlot = bookedSlots.find(
          (bookedSlot) =>
            bookedSlot.startTime === newSlot.startTime &&
            bookedSlot.endTime === newSlot.endTime
        );

        if (existingBookedSlot) {
          return {
            ...newSlot,
            isBooked: true,
            _id: existingBookedSlot._id,
          };
        }

        return {
          ...newSlot,
          isBooked: false,
        };
      });

      // 4. Update only the time slots array
      const updatedTimeSlot = await timeSlotModel.findByIdAndUpdate(
        slotId,
        {
          $set: {
            timeSlots: updatedTimeSlots,
          },
        },
        { new: true }
      );

      return res.status(200).json({
        StatusCode: 200,
        IsSuccess: true,
        ErrorMessage: [],
        Result: {
          message:
            "Time slots updated successfully (other details unchanged due to booked slots)",
          updatedTimeSlot,
        },
      });
    }

    // Validate fee for full update
    if (typeof fee !== "number" || fee <= 0) {
      return next(createError(400, "Fee must be a positive number."));
    }

    // If no slots are booked, allow full update
    const updatedTimeSlot = await timeSlotModel.findByIdAndUpdate(
      slotId,
      {
        $set: {
          timeSlots: timeSlots.map((slot) => ({
            ...slot,
            isBooked: false,
          })),
          timezone,
          subjectName,
          gradeLevel,
          notes,
          daysOfWeek,
          fee,
        },
      },
      { new: true }
    );

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Time slot updated successfully",
        updatedTimeSlot,
      },
    });
  } catch (error) {
    console.error("Update Time Slot Error:", error);
    return next(createError(500, "Server Error while updating time slot."));
  }
};

module.exports = {
  createTimeSlot,
  getAllTimeSlots,
  deleteTimeSlot,
  deleteSpecificTimeSlot,
  updatedTimeSlot,
};
