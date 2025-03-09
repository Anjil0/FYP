import { useState, useEffect } from "react";
import axios from "axios";
import baseUrl from "/src/config/config";
import { toast } from "sonner";
import { Calendar, Clock } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { disableScroll, enableScroll } from "../utils/ScrollLock";

// eslint-disable-next-line react/prop-types
const TimeSlotBooking = ({ tutorId }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTime, setSelectedTime] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [duration, setDuration] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachingMode, setTeachingMode] = useState(null);

  const fetchTutorTimeSlots = async () => {
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
        setTeachingMode(response.data.Result.timeSlots[0].sessionType);
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
  }, [tutorId]);

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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Available Time Slots
      </h2>

      {/* Subject Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Subject
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full p-2 border rounded-lg"
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
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
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
                  . Please check back later or select a different subject.
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
                      {filteredTimeSlots[0].daysOfWeek.map((day) => (
                        <span
                          key={day}
                          className="px-4 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 
                             text-blue-600 rounded-full text-sm font-medium
                             border border-blue-200 shadow-sm"
                        >
                          {day}
                        </span>
                      ))}
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
                              onClick={() => {
                                setSelectedTime({
                                  slotId: slot._id,
                                  timeId: time._id,
                                  startTime: time.startTime,
                                  endTime: time.endTime,
                                  days: slot.daysOfWeek,
                                  fee: slot.fee,
                                  subjectName: slot.subjectName,
                                  gradeLevel: slot.gradeLevel,
                                });
                                setShowBookingModal(true);
                              }}
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
                              <div className="mt-2 text-sm text-gray-500">
                                Rs. {slot.fee}/month
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

      {/* Booking Modal */}
      {showBookingModal && selectedTime && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Confirm Booking</h3>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-4">
                {/* Selected Time */}
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>
                    {selectedTime.startTime} - {selectedTime.endTime}
                  </span>
                </div>
                {/* Teaching Mode */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Teaching Mode</span>
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

                {/* Fee Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Monthly Fee</span>
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
                    className="w-full p-2 border rounded-lg"
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
                    className="w-full p-2 border rounded-lg"
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
                      <span className="font-bold text-lg">
                        Rs. {calculateTotalCost()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-yellow-50 p-4 rounded-lg">
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
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookingConfirm}
                  disabled={loading || !startDate}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Request Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotBooking;
