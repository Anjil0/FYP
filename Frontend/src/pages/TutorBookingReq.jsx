import { useState, useEffect } from "react";
import axios from "axios";
import baseUrl from "/src/config/config";
import { toast, Toaster } from "sonner";
import { Calendar, Clock, User, BookOpen, DollarSign } from "lucide-react";
import { format } from "date-fns";

const TutorBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const filterTabs = [
    "all",
    "pending",
    "paymentPending",
    "ongoing",
    "completed",
    "cancelled",
  ];
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${baseUrl}/api/bookings/tutorBookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess) {
        setBookings(response.data.Result.bookings);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.ErrorMessage?.[0]?.message ||
          "Server Error on fetching Bookings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setCancelling(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.put(
        `${baseUrl}/api/bookings/cancel/${selectedBooking._id}`,
        { cancellationReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess) {
        toast.success("Booking cancelled successfully");
        fetchBookings();
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancellationReason("");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.ErrorMessage?.[0]?.message ||
          "Failed to cancel booking"
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.put(
        `${baseUrl}/api/bookings/confirm/${bookingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess) {
        toast.success("Booking confirmed successfully!");
        fetchBookings();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.ErrorMessage?.[0]?.message ||
          "Failed to confirm booking"
      );
    }
  };

  const handleUpdatePaymentStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.put(
        `${baseUrl}/api/bookings/payment/physical/${bookingId}`,
        { paymentStatus: status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess) {
        toast.success("Payment status updated successfully!");
        fetchBookings();
      }
    } catch (error) {
      console.log("Error on changing payment Status.", error);
      toast.error(
        error.response?.data?.ErrorMessage[0]?.message ||
          "Error on changing payment Status."
      );
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Student Bookings
        </h1>

        {/* Updated Filter Tabs */}
        <div className="flex gap-4 border-b">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 capitalize ${
                filter === tab
                  ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No{" "}
          {filter !== "all"
            ? filter
                .replace(/([A-Z])/g, " $1")
                .trim()
                .toLowerCase()
            : ""}{" "}
          bookings found
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-lg shadow-md p-4 space-y-4"
            >
              {/* Student Info */}
              <div className="flex items-center gap-3 pb-4 border-b">
                <User className="w-5 h-5 text-gray-500" />
                <div className="space-y-1">
                  <h3 className="text-sm">
                    <span className="font-medium text-gray-600">
                      Username:{" "}
                    </span>
                    {booking.studentId?.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-600">Email: </span>
                    {booking.studentId?.email}
                  </p>
                </div>
              </div>

              {/* Subject & Grade */}
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {booking.timeSlotId?.subjectName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.timeSlotId?.gradeLevel}
                  </p>
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.timeSlot?.days?.join(", ")}
                  </p>
                </div>
              </div>

              {/* Duration & Dates */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {format(new Date(booking.startDate), "MMM d, yyyy")} -{" "}
                    {format(new Date(booking.endDate), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.duration}{" "}
                    {booking.duration === 1 ? "month" : "months"}
                  </p>
                </div>
              </div>

              {/* Teaching Mode */}
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-1.5 rounded-full bg-blue-50">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {booking.teachingMode} Class
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.teachingMode === "online"
                      ? "Virtual sessions via online platform"
                      : "In-person sessions"}
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">
                    Total: Rs. {booking.totalAmount}
                  </p>
                  <p className="text-sm text-gray-500">
                    Rs. {booking.fee} per month
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    booking.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : booking.status === "ongoing"
                      ? "bg-blue-100 text-blue-800"
                      : booking.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : booking.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {booking.status
                    .replace(/([A-Z])/g, " $1")
                    .trim()
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </span>

                {/* Show payment status pill only when payment is pending */}
                {(booking.status === "ongoing" ||
                  booking.status === "ongoing") &&
                  booking.teachingMode === "physical" && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        booking.paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : booking.paymentStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      Payment: {booking.paymentStatus}
                    </span>
                  )}
              </div>
              {/* Updated Action Buttons */}
              <div className="flex gap-3 pt-4">
                {(booking.status === "pending" ||
                  booking.status === "paymentPending") && (
                  <>
                    {booking.status === "pending" && (
                      <button
                        onClick={() => handleConfirmBooking(booking._id)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Confirm Booking
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowCancelModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {/* Show cancel button for ongoing bookings too */}
                {booking.status === "ongoing" && (
                  <>
                    {booking.teachingMode === "physical" &&
                      booking.paymentStatus === "pending" && (
                        <button
                          onClick={() =>
                            handleUpdatePaymentStatus(booking._id, "completed")
                          }
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Mark as Paid
                        </button>
                      )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Cancel Booking
            </h3>

            {/* Booking Details Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Student:</span>{" "}
                {selectedBooking?.studentId?.username}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Subject:</span>{" "}
                {selectedBooking?.timeSlotId?.subjectName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Schedule:</span>{" "}
                {selectedBooking?.timeSlot?.startTime} -{" "}
                {selectedBooking?.timeSlot?.endTime}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Please provide a reason for cancellation..."
              />
              {!cancellationReason.trim() && (
                <p className="text-sm text-red-500">
                  Cancellation reason is required
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancellationReason("");
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling || !cancellationReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Cancelling...</span>
                  </div>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorBookingsPage;
