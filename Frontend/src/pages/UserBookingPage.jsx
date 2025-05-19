import { useState, useEffect } from "react";
import axios from "axios";
import baseUrl from "/src/config/config";
import { toast, Toaster } from "sonner";
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  AlertCircle,
  TimerIcon,
  BookOpen,
  Star,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Award,
  Shield,
  MessageCircle,
  X,
  BadgeCheck,
  CalendarIcon,
  ClockIcon,
} from "lucide-react";
import { format } from "date-fns";

const UserBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handlePayment = async (bookingId) => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${baseUrl}/api/payments/payBooking`,
        { bookingId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchBookings();
      if (
        response.data &&
        response.data.Result &&
        response.data.Result.payment &&
        response.data.Result.payment.payment_url
      ) {
        window.location.href = response.data.Result.payment.payment_url;
      } else {
        toast.error("Error generating payment URL.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.ErrorMessage?.[0]?.message ||
          "Failed to process payment"
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${baseUrl}/api/bookings/studentBookings`,
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
                // If error, assume not rated
                console.log("Rating not found for booking:", booking._id);
              }
            }

            return {
              ...booking,
              isRated: booking.status === "rated", // If status is rated, mark as rated
            };
          })
        );

        setBookings(processedBookings);
      }
    } catch (error) {
      toast.error("Failed to fetch your bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openRatingModal = (booking) => {
    setSelectedBooking(booking);
    setRating(0);
    setHoveredRating(0);
    setReview("");
    setIsRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
    setSelectedBooking(null);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating", {
        description: "Your rating helps other students find great tutors",
      });
      return;
    }

    try {
      setSubmittingRating(true);
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${baseUrl}/api/ratings/giveRating`,
        {
          bookingId: selectedBooking._id,
          rating,
          review,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the current booking in state to show as rated
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === selectedBooking._id
            ? {
                ...booking,
                isRated: true,
                status: "rated",
                rating,
                review,
              }
            : booking
        )
      );

      toast.success("Rating submitted successfully", {
        description: "Thank you for sharing your experience!",
        icon: <Star className="text-yellow-400" />,
      });
      closeRatingModal();
    } catch (error) {
      toast.error(
        error.response?.data?.ErrorMessage?.[0]?.message ||
          "Failed to submit rating",
        {
          description: "Please try again later",
        }
      );
    } finally {
      setSubmittingRating(false);
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
        return <Sparkles className="w-5 h-5 text-yellow-500" />;
      case 4:
        return <Award className="w-5 h-5 text-blue-500" />;
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

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true;
    // Include both "completed" and "rated" status in the completed filter
    if (activeTab === "completed")
      return booking.status === "completed" || booking.status === "rated";
    return booking.status === activeTab;
  });

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
                My Learning Journey
              </h1>
              <p className="mt-2 text-gray-600">
                Track and manage all your tutoring sessions
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
                  Completed:{" "}
                  {
                    bookings.filter(
                      (b) => b.status === "completed" || b.status === "rated"
                    ).length
                  }
                </span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Ongoing:{" "}
                  {bookings.filter((b) => b.status === "ongoing").length}
                </span>
              </div>
            </div>
          </div>

          {/* Booking Stats */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                "all",
                "ongoing",
                "paymentPending",
                "completed",
                "cancelled",
              ].map((status) => {
                // Calculate number of completed bookings that need rating
                let needsRatingCount = 0;
                let completedCount = 0;

                if (status === "completed") {
                  completedCount = bookings.filter(
                    (b) => b.status === "completed" || b.status === "rated"
                  ).length;
                  needsRatingCount = bookings.filter(
                    (b) => b.status === "completed" && !b.isRated
                  ).length;
                }

                return (
                  <button
                    key={status}
                    onClick={() => setActiveTab(status)}
                    className={`${
                      activeTab === status
                        ? "border-blue-500 bg-white shadow-sm"
                        : "border-transparent bg-gray-50 hover:bg-white hover:shadow-sm"
                    } p-4 rounded-lg border-2 transition-all duration-200 flex flex-col relative`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="text-sm font-medium text-gray-500 capitalize">
                        {status === "paymentPending" ? "Payment Due" : status}
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900">
                      {status === "all"
                        ? bookings.length
                        : status === "completed"
                        ? bookings.filter(
                            (b) =>
                              b.status === "completed" || b.status === "rated"
                          ).length
                        : bookings.filter((b) => b.status === status).length}
                    </div>

                    {/* Show rating needed badge */}
                    {status === "completed" && needsRatingCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {needsRatingCount}
                      </div>
                    )}
                  </button>
                );
              })}
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
              You don&apos;t have any {activeTab !== "all" && activeTab}{" "}
              bookings yet.
            </p>
            <div className="mt-6">
              <a
                href="/tutors"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                Find a tutor
                <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </div>
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

                    {/* Improved rating badge */}
                    {booking.status === "rated" && (
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
                  {/* Tutor Info */}
                  <div className="flex items-center space-x-4">
                    {booking.tutorId?.image ? (
                      <img
                        src={booking.tutorId.image || "/placeholder.svg"}
                        alt={booking.tutorId.username}
                        className="h-12 w-12 rounded-full object-cover border-2 border-blue-100"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.tutorId?.username || "Tutor Name"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.tutorId?.email || "Tutor Email"}
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
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'rated' && (
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
                    </div>
                  )}

                  {/* Duration & Payment */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Rs. {booking.totalAmount}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 bg-blue-50 px-3 py-1 rounded-lg">
                        {booking.duration}{" "}
                        {booking.duration === 1 ? "month" : "months"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 flex items-center justify-center gap-2 bg-gray-50 p-2 rounded-lg">
                      <Calendar className="w-3 h-3" />
                      {format(
                        new Date(booking.startDate),
                        "MMM d, yyyy"
                      )} - {format(new Date(booking.endDate), "MMM d, yyyy")}
                    </div>
                  </div>

                  {/* Payment Pending Section */}
                  {booking.status === "paymentPending" && (
                    <div className="pt-4">
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-orange-800">
                          <AlertCircle className="w-5 h-5" />
                          <p className="text-sm font-medium">
                            Payment Required
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-orange-600">
                          Please complete your payment to confirm this booking.
                        </p>
                      </div>

                      <button
                        onClick={() => handlePayment(booking._id)}
                        disabled={processingPayment}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg
                         flex items-center justify-center gap-2 font-medium transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {processingPayment ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>Pay Rs. {booking.totalAmount}</>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Completed Booking Section - Show rate button for completed but not rated */}
                  {booking.status === "completed" && !booking.isRated && (
                    <div className="pt-4">
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-red-800">
                          <Star className="w-5 h-5" />
                          <p className="text-sm font-medium">Rating Needed</p>
                        </div>
                        <p className="mt-1 text-sm text-red-600">
                          Your feedback helps other students find great tutors.
                        </p>
                      </div>
                      <button
                        onClick={() => openRatingModal(booking)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg
                          flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
                      >
                        <Star className="w-5 h-5" />
                        Rate Your Experience
                      </button>
                    </div>
                  )}

                  {/* Rated Booking Section - Improved UI */}
                  {booking.isRated && (
                    <div className="pt-4">
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-green-800">
                            <BadgeCheck className="w-5 h-5" />
                            <p className="text-sm font-medium">
                              Rating Submitted
                            </p>
                          </div>
                          <div className="bg-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1 border border-green-100">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {booking.rating}
                            </span>
                          </div>
                        </div>

                        {/* Display the user's rating with improved UI */}
                        <div className="flex flex-col">
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-50">
                            <div className="flex items-center mb-2 justify-between">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      booking.rating >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                                {getRatingIcon(booking.rating)}
                                {getRatingText(booking.rating)}
                              </span>
                            </div>

                            {booking.review ? (
                              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                                &quot;{booking.review}&quot;
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic text-center py-1">
                                No written feedback provided
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal - Improved UI */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Rate Your Experience
              </h3>
              <button
                type="button"
                onClick={closeRatingModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Tutor Information */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                {selectedBooking?.tutorId?.image ? (
                  <img
                    src={selectedBooking.tutorId.image || "/placeholder.svg"}
                    alt={selectedBooking.tutorId.username}
                    className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <User className="h-8 w-8 text-blue-500" />
                  </div>
                )}
                <div>
                  <p className="text-base font-medium text-gray-900">
                    {selectedBooking?.tutorId?.username || "Tutor"}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {selectedBooking?.timeSlotId?.subjectName || "Subject"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedBooking?.timeSlotId?.gradeLevel}
                  </p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </p>
                <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-50 to-blue-50 p-5 rounded-lg">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110 relative"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          (
                            hoveredRating > 0
                              ? hoveredRating >= star
                              : rating >= star
                          )
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        } transition-colors duration-150`}
                      />
                      <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
                        {star}
                      </span>
                    </button>
                  ))}
                </div>
                {(rating > 0 || hoveredRating > 0) && (
                  <div className="text-center mt-3 mb-2">
                    <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium inline-flex items-center">
                      {getRatingIcon(hoveredRating || rating)}
                      <span className="ml-1">
                        {getRatingText(hoveredRating || rating)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Review Text */}
              <div className="mb-6">
                <label
                  htmlFor="review"
                  className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  Your Review (Optional)
                </label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience with this tutor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
                />
                <p className="mt-1 text-xs text-gray-500 flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Your honest feedback helps improve our tutoring community.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeRatingModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={submittingRating || rating === 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
                >
                  {submittingRating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Submit Rating
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookingsPage;
