/* eslint-disable react/prop-types */
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import axios from "axios";
import baseUrl from "/src/config/config";
import { toast, Toaster } from "sonner";
import {
  Calendar,
  Clock,
  Info,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { disableScroll, enableScroll } from "../utils/ScrollLock";
import { useLoading } from "../config/LoadingContext";
import { isValidToken } from "../authUtils/authUtils";

const TimeSlotBooking = ({
  tutorId,
  timeSlots: initialTimeSlots = [],
  isAvailable = true,
}) => {
  const { setLoading } = useLoading();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTime, setSelectedTime] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [duration, setDuration] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading] = useState(false);
  const [teachingMode, setTeachingMode] = useState(null);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    if (showLoginModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showLoginModal]);

  const fetchTutorTimeSlots = async () => {
    if (initialTimeSlots.length > 0) {
      setTimeSlots(initialTimeSlots);
      if (initialTimeSlots[0]) {
        setTeachingMode(initialTimeSlots[0].sessionType);
      }
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${baseUrl}/api/timeslots/getAllTimeSlots/${tutorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.IsSuccess && response.data.Result.timeSlots) {
        setTimeSlots(response.data.Result.timeSlots);
        if (response.data.Result.timeSlots[0]) {
          setTeachingMode(response.data.Result.timeSlots[0].sessionType);
        }
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessages = error.response.data.ErrorMessage.map(
          (err) => err.message
        ).join(", ");
        toast.error(`${errorMessages}`);
      } else {
        toast.error("Failed to fetch tutor's time slots");
      }
    }
  };

  useEffect(() => {
    fetchTutorTimeSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorId, initialTimeSlots]);

  useEffect(() => {
    if (showBookingModal) {
      disableScroll();
    }
    return () => {
      enableScroll();
    };
  }, [showBookingModal]);

  const handleCloseModal = () => {
    setDuration(1);
    setStartDate(null);
    setShowBookingModal(false);
    setSelectedTime(null);
    enableScroll();
  };

  const subjects = [...new Set(timeSlots.map((slot) => slot.subjectName))];

  const filteredTimeSlots = selectedSubject
    ? timeSlots.filter((slot) => slot.subjectName === selectedSubject)
    : [];

  const calculateTotalCost = () => {
    if (!selectedTime) return 0;
    return selectedTime.fee * duration;
  };

  const handleBookingConfirm = async () => {
    if (!startDate || !selectedTime) {
      toast.error("Please select a start date");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // Check for overlapping bookings
      const checkOverlapResponse = await axios.get(
        `${baseUrl}/api/bookings/studentBookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (checkOverlapResponse.data.IsSuccess) {
        const existingBookings = checkOverlapResponse.data.Result.bookings;
        const newBookingStart = startDate;
        const newBookingEnd = new Date(startDate);
        newBookingEnd.setMonth(newBookingEnd.getMonth() + duration);

        // Check for overlaps with existing bookings
        const hasOverlap = existingBookings.some((booking) => {
          // Only check active bookings with relevant statuses
          if (
            booking.status !== "ongoing" &&
            booking.status !== "paymentPending" &&
            booking.status !== "pending"
          ) {
            return false;
          }

          const existingStart = new Date(booking.startDate);
          const existingEnd = new Date(booking.endDate);

          // First check if dates overlap
          const datesOverlap =
            (newBookingStart >= existingStart &&
              newBookingStart < existingEnd) ||
            (newBookingEnd > existingStart && newBookingEnd <= existingEnd) ||
            (newBookingStart <= existingStart && newBookingEnd >= existingEnd);

          if (!datesOverlap) return false;

          // If dates overlap, check if times and days overlap
          const newTimeSlot = selectedTime;
          const existingTimeSlot = booking.timeSlot;

          // Check if the time slots overlap
          const timeOverlap =
            existingTimeSlot.startTime &&
            existingTimeSlot.endTime &&
            (newTimeSlot.startTime === existingTimeSlot.startTime ||
              newTimeSlot.endTime === existingTimeSlot.endTime ||
              (newTimeSlot.startTime < existingTimeSlot.endTime &&
                newTimeSlot.endTime > existingTimeSlot.startTime));

          if (!timeOverlap) return false;

          // Check if any days overlap
          const daysOverlap =
            existingTimeSlot.days &&
            newTimeSlot.days.some((day) => existingTimeSlot.days.includes(day));

          return daysOverlap;
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (hasOverlap) {
          toast.error(
            "This booking overlaps with one of your existing bookings. Please choose a different time slot or date."
          );
          setLoading(false);
          return;
        }
      }

      // If no overlap, proceed with creating the booking
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await axios.post(
        `${baseUrl}/api/bookings/createBooking`,
        {
          tutorId,
          timeSlotId: selectedTime.slotId,
          specificTimeSlotId: selectedTime.timeId,
          startDate: startDate.toISOString(),
          duration,
          fee: selectedTime.fee,
          totalAmount: calculateTotalCost(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess) {
        toast.success("Booking request sent! Awaiting tutor confirmation");
        handleCloseModal();
        fetchTutorTimeSlots();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.ErrorMessage?.[0]?.message || "Booking failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotClick = (time, slot) => {
    const token = localStorage.getItem("accessToken");
    if (!token || !isValidToken(token)) {
      setShowLoginModal(true);
      return;
    }
    setSelectedTime({
      slotId: slot._id,
      timeId: time._id,
      startTime: time.startTime,
      endTime: time.endTime,
      days: slot.daysOfWeek,
      fee: slot.fee,
      subjectName: slot.subjectName,
      gradeLevel: slot.gradeLevel,
      notes: slot.notes,
    });
    setShowBookingModal(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <Toaster />
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Calendar className="w-5 h-5 text-blue-500" />
        </div>
        Available Time Slots
      </h2>

      {!isAvailable ? (
        <div className="bg-red-50 rounded-xl p-8 text-center border border-red-100 shadow-sm">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">
            Tutor Currently Unavailable
          </h4>
          <p className="text-gray-600 max-w-md mx-auto">
            This tutor is not currently available for booking. Please check back
            later or browse other tutors.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "available"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("available")}
            >
              Available Slots
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "how"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("how")}
            >
              How It Works
            </button>
          </div>

          {activeTab === "how" ? (
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                How Booking Works
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Select a Subject & Time Slot
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Choose from the tutor's available subjects and time slots
                      that work for you.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Request Booking
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Submit your booking request with your preferred start date
                      and duration.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Tutor Confirmation
                    </h4>
                    <p className="text-gray-600 text-sm">
                      The tutor will review and confirm your booking request.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Payment</h4>
                    <p className="text-gray-600 text-sm">
                      Once confirmed, you'll be prompted to complete the payment
                      to secure your booking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {timeSlots.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">
                    No Time Slots Available
                  </h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    This tutor hasn't added any time slots yet. Please check
                    back later.
                  </p>
                </div>
              ) : (
                <>
                  {/* Subject Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Subject
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Choose a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSubject && (
                    <>
                      {/* Available Time Slots */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-500" />
                          Available Time Slots for {selectedSubject}
                        </h3>

                        {filteredTimeSlots.length === 0 ||
                        !filteredTimeSlots.some((slot) =>
                          slot.timeSlots.some((time) => !time.isBooked)
                        ) ? (
                          // No time slots message
                          <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-800 mb-2">
                              No Available Time Slots
                            </h4>
                            <p className="text-gray-600 max-w-md mx-auto">
                              There are currently no available time slots for{" "}
                              <span className="font-medium text-blue-600">
                                {selectedSubject}
                              </span>
                              . Please check back later or select a different
                              subject.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Days Section */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-blue-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <h4 className="font-medium text-gray-700">
                                    Available Days
                                  </h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {filteredTimeSlots[0].daysOfWeek.map(
                                    (day) => (
                                      <span
                                        key={day}
                                        className="px-4 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 
                                         text-blue-600 rounded-full text-sm font-medium
                                         border border-blue-200 shadow-sm"
                                      >
                                        {day}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Time Slots Grid */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {filteredTimeSlots.map((slot) =>
                                  slot.timeSlots.map(
                                    (time) =>
                                      !time.isBooked && (
                                        <button
                                          key={time._id}
                                          onClick={() =>
                                            handleTimeSlotClick(time, slot)
                                          }
                                          className="group relative p-4 border rounded-xl hover:border-blue-300 
                                           hover:shadow-md transition-all duration-200 bg-gradient-to-r 
                                           from-white to-gray-50 hover:from-blue-50 hover:to-white"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                              <Clock className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="font-medium text-gray-700 group-hover:text-blue-600">
                                              {time.startTime} - {time.endTime}
                                            </span>
                                          </div>
                                          <div className="mt-2 flex items-center gap-1 text-sm">
                                            <DollarSign className="w-3 h-3 text-green-600" />
                                            <span className="text-green-600 font-medium">
                                              Rs. {slot.fee}
                                            </span>
                                            <span className="text-gray-500">
                                              /month
                                            </span>
                                          </div>
                                        </button>
                                      )
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedTime && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header - Fixed */}
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                Confirm Booking
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedTime.subjectName} - {selectedTime.gradeLevel}
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-4">
                {/* Selected Time */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-800">Time Slot</div>
                    <div className="text-blue-700">
                      {selectedTime.startTime} - {selectedTime.endTime}
                    </div>
                  </div>
                </div>

                {/* Available Days */}
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="font-medium text-gray-800 mb-2">
                    Available Days
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTime.days.map((day) => (
                      <span
                        key={day}
                        className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-medium border border-indigo-200"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Teaching Mode */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Teaching Mode</span>
                    <span className="font-medium text-blue-700 capitalize">
                      {teachingMode || "Loading..."}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {teachingMode === "online"
                      ? "Payment will be processed online after tutor confirmation"
                      : "Payment will be handled physically after tutor confirmation"}
                  </p>
                </div>

                {/* Notes */}
                {selectedTime.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg flex gap-3">
                    <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-800 mb-1">
                        Tutor Notes
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedTime.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Fee Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Monthly Fee</span>
                    <span className="font-semibold text-green-700">
                      Rs. {selectedTime.fee}
                    </span>
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={setStartDate}
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Select start date"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Duration (months)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 2, 3, 6, 12].map((months) => (
                      <option key={months} value={months}>
                        {months} {months === 1 ? "month" : "months"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cost Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Monthly Fee</span>
                    <span className="font-medium">Rs. {selectedTime.fee}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{duration} months</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Cost</span>
                      <span className="font-bold text-lg text-green-700">
                        Rs. {calculateTotalCost()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="flex gap-3 p-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    {teachingMode === "online"
                      ? "You will be able to make the payment after the tutor confirms your booking."
                      : "Payment will be handled physically with the tutor after confirmation."}
                  </p>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="p-6 border-t">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookingConfirm}
                  disabled={loading || !startDate}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Request Booking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLoginModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Login Required
            </h3>
            <p className="text-gray-600 mb-6">Please login to book a Tutor.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <a
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotBooking;
