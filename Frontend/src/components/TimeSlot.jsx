import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, Globe } from "lucide-react";
import baseUrl from "/src/config/config";
import { disableScroll, enableScroll } from "../utils/ScrollLock";
// eslint-disable-next-line react/prop-types
const TimeSlotModal = ({ isOpen, onClose, editingSlot = null }) => {
  const [formData, setFormData] = useState({
    timeSlots: [],
    daysOfWeek: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    subjectName: "",
    gradeLevel: "",
    sessionType: "",
    notes: "",
    fee: "",
  });

  useEffect(() => {
    if (editingSlot) {
      setFormData({
        timeSlots: editingSlot.timeSlots,
        daysOfWeek: editingSlot.daysOfWeek,
        timezone: editingSlot.timezone,
        subjectName: editingSlot.subjectName,
        gradeLevel: editingSlot.gradeLevel,
        sessionType: editingSlot.sessionType || "",
        notes: editingSlot.notes || "",
        fee: editingSlot.fee || "",
      });
      setHasBookedSlots(editingSlot.timeSlots.some((slot) => slot.isBooked));
    } else {
      resetForm();
      setHasBookedSlots(false);
    }
  }, [editingSlot]);

  const [currentTimeSlot, setCurrentTimeSlot] = useState({
    startTime: "",
    endTime: "",
  });

  const [hasBookedSlots, setHasBookedSlots] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      disableScroll();
    }
    return () => {
      enableScroll();
    };
  }, [isOpen]);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const timeSlots = Array.from({ length: 24 * 4 }).map((_, index) => {
    const hour = Math.floor(index / 4);
    const minute = (index % 4) * 15;
    const time = new Date();
    time.setHours(hour, minute, 0);
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  });

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const validateTimeDifference = (startTime, endTime) => {
    if (!startTime || !endTime) return true;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const difference = endMinutes - startMinutes;
    return difference >= 45 && difference > 0;
  };

  const handleTimeSlotChange = (e) => {
    const { name, value } = e.target;
    setCurrentTimeSlot((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTimeSlot = () => {
    if (!currentTimeSlot.startTime || !currentTimeSlot.endTime) {
      toast.error("Please select both start and end time");
      return;
    }

    if (
      !validateTimeDifference(
        currentTimeSlot.startTime,
        currentTimeSlot.endTime
      )
    ) {
      toast.error(
        "Time slot must be at least 45 minutes and end time must be after start time"
      );
      return;
    }

    const currentStart = timeToMinutes(currentTimeSlot.startTime);
    const currentEnd = timeToMinutes(currentTimeSlot.endTime);

    // Check for any kind of overlap with existing slots
    const isOverlapping = formData.timeSlots.some((slot) => {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      
      // Check if either the start or end time falls within an existing slot
      // or if the new slot completely encompasses an existing slot
      return (currentStart <= slotEnd && currentEnd >= slotStart);
    });

    if (isOverlapping) {
      toast.error("Time slots cannot overlap, including partial overlaps");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, currentTimeSlot],
    }));

    setCurrentTimeSlot({
      startTime: "",
      endTime: "",
    });

    toast.success("Time slot added successfully");
  };

  const handleRemoveTimeSlot = (index) => {
    const slot = formData.timeSlots[index];
    if (slot.isBooked) {
      toast.error("Cannot remove booked time slots");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
    toast.success("Time slot removed");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (hasBookedSlots) {
      toast.error("Cannot modify details when slots are booked");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "fee" ? Number(value) : value,
    }));
  };

  const handleDayToggle = (day) => {
    if (hasBookedSlots) {
      toast.error("Cannot modify days when slots are booked");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.timeSlots.length === 0) {
      newErrors.time = "At least one time slot is required";
    }

    if (formData.daysOfWeek.length === 0) {
      newErrors.days = "Please select at least one day";
    }

    if (!formData.subjectName.trim()) {
      newErrors.subject = "Subject name is required";
    }

    if (!formData.gradeLevel) {
      newErrors.grade = "Grade level is required";
    }

    if (!formData.fee || formData.fee <= 0) {
      newErrors.fee = "Fee must be a positive number";
    }

    if (editingSlot) {
      const hasRemovedBookedSlots = editingSlot.timeSlots.some(
        (oldSlot) =>
          oldSlot.isBooked &&
          !formData.timeSlots.some(
            (newSlot) =>
              newSlot.startTime === oldSlot.startTime &&
              newSlot.endTime === oldSlot.endTime
          )
      );

      if (hasRemovedBookedSlots) {
        newErrors.time = "Cannot remove booked time slots";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      // First, fetch all existing time slots
      const allTimeSlotsResponse = await axios.get(
        `${baseUrl}/api/timeslots/getAllTimeSlots`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (allTimeSlotsResponse.data.IsSuccess) {
        const existingTimeSlots = allTimeSlotsResponse.data.Result.timeSlots;

        // Skip checking the current slot if editing
        const slotsToCheck = editingSlot
          ? existingTimeSlots.filter((slot) => slot._id !== editingSlot._id)
          : existingTimeSlots;

        // Check for overlaps with existing slots
        for (const existingSlot of slotsToCheck) {
          // Check if days overlap
          const hasOverlappingDays = formData.daysOfWeek.some((day) =>
            existingSlot.daysOfWeek.includes(day)
          );

          if (hasOverlappingDays) {
            // Check if time slots overlap
            for (const newSlot of formData.timeSlots) {
              for (const existingTime of existingSlot.timeSlots) {
                const newStart = timeToMinutes(newSlot.startTime);
                const newEnd = timeToMinutes(newSlot.endTime);
                const existingStart = timeToMinutes(existingTime.startTime);
                const existingEnd = timeToMinutes(existingTime.endTime);

                // Check for any kind of overlap
                if (newStart <= existingEnd && newEnd >= existingStart) {
                  toast.error(
                    `Time slot ${newSlot.startTime} - ${newSlot.endTime} overlaps with an existing slot (${existingTime.startTime} - ${existingTime.endTime}) on ${formData.daysOfWeek.join(", ")}`
                  );
                  return;
                }
              }
            }
          }
        }
      }

      // If no overlaps found, proceed with creating/updating the time slot
      const url = editingSlot
        ? `${baseUrl}/api/timeslots/updateTimeSlot/${editingSlot._id}`
        : `${baseUrl}/api/timeslots/createTimeSlot`;

      const method = editingSlot ? "put" : "post";

      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.IsSuccess) {
        toast.success(
          editingSlot
            ? "Time slot updated successfully"
            : "Time slot created successfully"
        );
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error("Error performing action on tutor:", error);
      if (error.response && error.response.data) {
        const errorMessages = error.response.data.ErrorMessage.map(
          (err) => err.message
        ).join(", ");
        toast.error(`${errorMessages}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      timeSlots: [],
      daysOfWeek: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      subjectName: "",
      gradeLevel: "",
      sessionType: "",
      notes: "",
      fee: "",
    });
    setCurrentTimeSlot({
      startTime: "",
      endTime: "",
    });
    setErrors({});
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {editingSlot ? "Edit Time Slot" : "Create Time Slot"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Time Slot Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-700">
                Time Slot Details
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                {formData.timezone}
              </div>
            </div>

            {/* Selected Time Slots */}
            {formData.timeSlots.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Selected Time Slots
                </label>
                <div className="space-y-2">
                  {formData.timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                    >
                      <span className="text-sm text-gray-600">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(index)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Time Slot */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Add Time Slot</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <select
                    name="startTime"
                    value={currentTimeSlot.startTime}
                    onChange={handleTimeSlotChange}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  >
                    <option value="">Select Start Time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <select
                    name="endTime"
                    value={currentTimeSlot.endTime}
                    onChange={handleTimeSlotChange}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  >
                    <option value="">Select End Time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddTimeSlot}
                className="mt-3 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Add Time Slot
              </button>
            </div>
            {errors.time && (
              <p className="text-red-500 text-sm mt-1">{errors.time}</p>
            )}
          </div>
          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days of Week{" "}
              {hasBookedSlots && (
                <span className="text-red-500">
                  (Locked - Booked slots exist)
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  disabled={hasBookedSlots}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    formData.daysOfWeek.includes(day)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  } ${hasBookedSlots ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {day}
                </button>
              ))}
              {errors.days && (
                <p className="text-red-500 text-sm mt-1">{errors.days}</p>
              )}
            </div>
          </div>

          {/* Subject/Course Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Subject/Course Details{" "}
              {hasBookedSlots && (
                <span className="text-red-500 text-sm">
                  (Locked - Booked slots exist)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border border-gray-300 p-2 ${
                    hasBookedSlots ? "bg-gray-100" : ""
                  }`}
                  required
                  disabled={hasBookedSlots}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level
                </label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border border-gray-300 p-2 ${
                    hasBookedSlots ? "bg-gray-100" : ""
                  }`}
                  required
                  disabled={hasBookedSlots}
                >
                  <option value="">Select Grade Level</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={`Grade ${i + 1}`}>
                      Grade {i + 1}
                    </option>
                  ))}
                  <option value="Bachelors">Bachelors</option>
                  <option value="Masters">Masters</option>
                </select>
                {errors.grade && (
                  <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
                )}
              </div>
            </div>
          </div>

          {/* Add Fee Input */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700">
              Fee Per Month{" "}
              {hasBookedSlots && (
                <span className="text-red-500 text-sm">
                  (Locked - Booked slots exist)
                </span>
              )}
            </h3>
            <input
              type="number"
              name="fee"
              value={formData.fee}
              onChange={handleInputChange}
              className={`w-full rounded-lg border border-gray-300 p-2 ${
                hasBookedSlots ? "bg-gray-100" : ""
              }`}
              placeholder="Enter fee amount"
              min="0"
              required
              disabled={hasBookedSlots}
            />
            {errors.fee && (
              <p className="text-red-500 text-sm mt-1">{errors.fee}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes{" "}
              {hasBookedSlots && (
                <span className="text-red-500">
                  (Locked - Booked slots exist)
                </span>
              )}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className={`w-full rounded-lg border border-gray-300 p-2 ${
                hasBookedSlots ? "bg-gray-100" : ""
              }`}
              placeholder="Add any additional notes for students..."
              disabled={hasBookedSlots}
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">Schedule Preview</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Time Slots:</span>
                {formData.timeSlots.length > 0 ? (
                  <ul className="ml-4 mt-2 space-y-1">
                    {formData.timeSlots.map((slot, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {slot.startTime} - {slot.endTime}
                      </li>
                    ))}
                  </ul>
                ) : (
                  " No time slots selected"
                )}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Days:</span>{" "}
                {formData.daysOfWeek.length > 0
                  ? formData.daysOfWeek.join(", ")
                  : "No days selected"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Subject:</span>{" "}
                {formData.subjectName || "Not specified"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Grade Level:</span>{" "}
                {formData.gradeLevel || "Not specified"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Fee:</span>{" "}
                {formData.fee ? `Rs. ${formData.fee}/month` : "Not specified"}
              </p>
              {formData.notes && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {formData.notes}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {editingSlot ? "Update Time Slot" : "Create Time Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeSlotModal;
