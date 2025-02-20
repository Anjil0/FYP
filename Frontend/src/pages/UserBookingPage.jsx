import { useState, useEffect } from "react";
import axios from "axios";
import baseUrl from "/src/config/config";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  AlertCircle,
  TimerIcon,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
const UserBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [processingPayment, setProcessingPayment] = useState(false);

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
        setBookings(response.data.Result.bookings);
      }
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Failed to fetch your bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "ongoing":
        return "bg-blue-100 text-blue-800 border-blue-200";
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
      default:
        return null;
    }
  };

  const filteredBookings = bookings.filter(
    (booking) => activeTab === "all" || booking.status === activeTab
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            My Learning Journey
          </h1>
          <p className="mt-2 text-gray-600">
            Track and manage all your tutoring sessions
          </p>

          {/* Booking Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {["all", "ongoing", "paymentPending", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`${
                  activeTab === status
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:bg-gray-50"
                } p-4 rounded-lg border-2 transition-all duration-200`}
              >
                <div className="text-sm font-medium text-gray-500 capitalize">
                  {status} Bookings
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {
                    bookings.filter((b) =>
                      status === "all" ? true : b.status === status
                    ).length
                  }
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Calendar className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No bookings found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You don&apos;t have any {activeTab !== "all" && activeTab}{" "}
              bookings yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Status Banner */}
                <div
                  className={`px-4 py-2 flex items-center justify-between ${getStatusColor(
                    booking.status
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(booking.status)}
                    <span className="text-sm font-medium capitalize">
                      {booking.status}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium
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
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
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
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Time</span>
                      </div>
                      <p className="text-sm font-medium">
                        {booking.timeSlot?.startTime} -{" "}
                        {booking.timeSlot?.endTime}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Days</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {booking.timeSlot?.days.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600"
                          >
                            {day.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Duration & Payment */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Rs. {booking.totalAmount}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {booking.duration}{" "}
                        {booking.duration === 1 ? "month" : "months"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {format(new Date(booking.startDate), "MMM d, yyyy")} -{" "}
                      {format(new Date(booking.endDate), "MMM d, yyyy")}
                    </div>
                  </div>
                  {booking.status === "paymentPending" && (
                    <div className="px-6 pb-6">
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertCircle className="w-5 h-5" />
                          <p className="text-sm font-medium">
                            Payment Required
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-yellow-600">
                          Please complete your payment to confirm this booking.
                        </p>
                      </div>

                      <button
                        onClick={() => handlePayment(booking._id)}
                        disabled={processingPayment}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg
                         flex items-center justify-center gap-2 font-medium transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookingsPage;
