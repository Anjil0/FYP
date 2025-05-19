import { useState, useEffect } from "react";
import axios from "axios";
import baseUrl from "/src/config/config";
import { toast, Toaster } from "sonner";
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  DollarSign,
  CheckCircle,
  AlertCircle,
  X,
  TimerIcon,
  Star,
  BadgeCheck,
  Shield,
  CalendarIcon,
  ClockIcon,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import { useLoading } from "../config/LoadingContext";

const TutorBookingsPage = () => {
  const { setLoading } = useLoading();
  const [bookings, setBookings] = useState([]);
  const [loading] = useState(false);
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
  const [showRatingDetails, setShowRatingDetails] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);

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
        // Process bookings to include rating information
        const processedBookings = await Promise.all(
          response.data.Result.bookings.map(async (booking) => {
            // If status is completed or rated, check if the booking has been rated
            if (booking.status === "completed" || booking.status === "rated") {
              try {
                const ratingResponse = await axios.get(
                  `${baseUrl}/api/ratings/getRatings/${booking._id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                if (
                  ratingResponse.data.IsSuccess &&
                  ratingResponse.data.Result.ratings
                ) {
                  return {
                    ...booking,
                    isRated: true,
                    rating: ratingResponse.data.Result.ratings.rating,
                    review: ratingResponse.data.Result.ratings.review,
                  };
                }
              } catch (ratingError) {
                if (ratingError.response && ratingError.response.data) {
                  const errorMessages =
                    ratingError.response.data.ErrorMessage.map(
                      (err) => err.message
                    ).join(", ");
                  toast.error(`${errorMessages}`);
                } else {
                  toast.error(
                    "An unexpected error occurred. Please try again."
                  );
                }
                console.log("Rating not found for booking:", booking._id);
              }
            }

            return {
              ...booking,
              isRated: booking.status === "rated",
            };
          })
        );

        setBookings(processedBookings);
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
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      setLoading(false);
      setCancelling(false);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
    } finally {
      setLoading(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "ongoing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "rated":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "paymentPending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <TimerIcon className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      case "ongoing":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "rated":
        return <BadgeCheck className="w-4 h-4" />;
      case "paymentPending":
        return <DollarSign className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 5:
        return "Excellent!";
      case 4:
        return "Very Good!";
      case 3:
        return "Good";
      case 2:
        return "Fair";
      case 1:
        return "Poor";
      default:
        return "";
    }
  };

  const getRatingIcon = (rating) => {
    switch (rating) {
      case 5:
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 4:
        return <ThumbsUp className="w-5 h-5 text-blue-500" />;
      case 3:
        return <Shield className="w-5 h-5 text-green-500" />;
      case 2:
        return <MessageCircle className="w-5 h-5 text-orange-500" />;
      case 1:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const closeRatingDetails = () => {
    setShowRatingDetails(false);
    setSelectedRating(null);
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    // Include both "completed" and "rated" status in the completed filter
    if (filter === "completed")
      return booking.status === "completed" || booking.status === "rated";
    return booking.status === filter;
  });

  // Count bookings by status
  const bookingCounts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    paymentPending: bookings.filter((b) => b.status === "paymentPending")
      .length,
    ongoing: bookings.filter((b) => b.status === "ongoing").length,
    completed: bookings.filter(
      (b) => b.status === "completed" || b.status === "rated"
    ).length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    rated: bookings.filter((b) => b.status === "rated").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster expand={true} richColors closeButton />
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-500" />
                My Teaching Schedule
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your tutoring sessions and student bookings
              </p>
            </div>

            <div className="hidden md:block">
              <div className="flex gap-2 items-center">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Total: {bookings.length}
                </span>
                <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Completed: {bookingCounts.completed}
                </span>
                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Rated: {bookingCounts.rated}
                </span>
              </div>
            </div>
          </div>

          {/* Booking Stats */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`${
                    filter === tab
                      ? "border-blue-500 bg-white shadow-sm"
                      : "border-transparent bg-gray-50 hover:bg-white hover:shadow-sm"
                  } p-4 rounded-lg border-2 transition-all duration-200 flex flex-col relative`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tab)}
                    <span className="text-sm font-medium text-gray-500 capitalize">
                      {tab === "paymentPending" ? "Payment Due" : tab}
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {bookingCounts[tab]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Calendar className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No bookings found
            </h3>
            <p className="mt-2 text-gray-500">
              You don&apos;t have any {filter !== "all" && filter} bookings yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
              >
                {/* Status Banner */}
                <div
                  className={`px-4 py-3 flex items-center justify-between ${getStatusColor(
                    booking.status
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(booking.status)}
                    <span className="text-sm font-medium capitalize">
                      {booking.status === "paymentPending"
                        ? "Payment Due"
                        : booking.status}
                    </span>

                    {/* Rating badge for rated bookings */}
                    {booking.isRated && (
                      <div className="flex items-center bg-white bg-opacity-70 px-2 py-0.5 rounded-full shadow-sm ml-1 border border-purple-200">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < booking.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-1 text-xs font-medium text-purple-800">
                          {booking.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium
                    ${
                      booking.teachingMode === "online"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {booking.teachingMode}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Student Info */}
                  <div className="flex items-center space-x-4">
                    {booking.studentId?.image ? (
                      <img
                        src={booking.studentId.image || "/placeholder.svg"}
                        alt={booking.studentId.username}
                        className="h-12 w-12 rounded-full object-cover border-2 border-blue-100"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.studentId?.username || "Student"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.studentId?.email || "Email"}
                      </p>
                    </div>
                  </div>

                  {/* Subject Info */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-50">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.timeSlotId?.subjectName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.timeSlotId?.gradeLevel}
                      </p>
                    </div>
                  </div>

                  {/* Schedule */}
                  {booking.status !== "cancelled" &&
                    booking.status !== "completed" &&
                    booking.status !== "rated" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600 font-medium">
                              Time
                            </span>
                          </div>
                          <p className="text-sm">
                            {booking.timeSlot?.startTime} -{" "}
                            {booking.timeSlot?.endTime}
                          </p>
                        </div>
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600 font-medium">
                              Days
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {booking.timeSlot?.days.map((day) => (
                              <span
                                key={day}
                                className="px-2 py-0.5 bg-white rounded text-xs font-medium text-gray-600 border border-gray-100"
                              >
                                {day.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleConfirmBooking(booking._id)}
                              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200"
                            >
                              Confirm Booking
                            </button>
                            <button
                              onClick={() => {
                                setShowCancelModal(true);
                                setSelectedBooking(booking);
                              }}
                              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200"
                            >
                              Cancel Booking
                            </button>
                          </>
                        )}

                        {booking?.teachingMode === "physical" &&
                          booking?.status === "ongoing" &&
                          booking?.paymentStatus !== "completed" && (
                            <button
                              onClick={() =>
                                handleUpdatePaymentStatus(
                                  booking?._id,
                                  "completed"
                                )
                              }
                              className="col-span-2 flex items-center justify-center w-full gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg
                              hover:bg-green-200 transition-colors duration-200"
                            >
                              <DollarSign className="w-4 h-4" />
                              Mark as Paid
                            </button>
                          )}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Cancel Booking
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancellationReason("");
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Booking Details Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg space-y-2 mb-4 border border-blue-50">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Student:</span>{" "}
                  {selectedBooking?.studentId?.username}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Subject:</span>{" "}
                  {selectedBooking?.timeSlotId?.subjectName}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Schedule:</span>{" "}
                  {selectedBooking?.timeSlot?.startTime} -{" "}
                  {selectedBooking?.timeSlot?.endTime}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
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
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Cancellation reason is required
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4 mt-4">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                    setCancellationReason("");
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling || !cancellationReason.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Confirm Cancel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Details Modal */}
      {showRatingDetails && selectedRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Student Rating
              </h3>
              <button
                type="button"
                onClick={closeRatingDetails}
                className="text-gray-400 hover:text-gray-500 focus:outline-none bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Student Information */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                {selectedRating.studentId?.image ? (
                  <img
                    src={selectedRating.studentId.image || "/placeholder.svg"}
                    alt={selectedRating.studentId.username}
                    className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <User className="h-8 w-8 text-blue-500" />
                  </div>
                )}
                <div>
                  <p className="text-base font-medium text-gray-900">
                    {selectedRating.studentId?.username || "Student"}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {selectedRating.timeSlotId?.subjectName || "Subject"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedRating.timeSlotId?.gradeLevel}
                  </p>
                </div>
              </div>

              {/* Rating Display */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Student&apos;s Rating
                </p>
                <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-50 to-blue-50 p-5 rounded-lg">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-8 w-8 ${
                          selectedRating.rating >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center mt-4 mb-2">
                  <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium inline-flex items-center">
                    {getRatingIcon(selectedRating.rating)}
                    <span className="ml-1">
                      {getRatingText(selectedRating.rating)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">
                    Student&apos;s Feedback
                  </p>
                </div>

                {selectedRating.review ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-600 italic">
                      &quot;{selectedRating.review}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                      No written feedback provided
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeRatingDetails}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorBookingsPage;
