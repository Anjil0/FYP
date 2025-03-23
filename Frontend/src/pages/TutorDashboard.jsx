/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import baseUrl from "/src/config/config";
import { useLoading } from "../config/LoadingContext";
import TimeSlotModal from "../components/TimeSlot";
import {
  Users,
  BookOpen,
  Clock,
  Calendar,
  TrendingUp,
  ChevronRight,
  Star,
  MessageSquare,
  Settings,
  CheckCircle,
  BarChart3,
  FileText,
  CalendarCheck,
  Check,
  X,
  Video,
  Lightbulb,
} from "lucide-react";

const TutorDashboard = () => {
  const { setLoading } = useLoading();
  const [dashboardData, setDashboardData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [availability, setAvailability] = useState();
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/tutors/getTutorDashboardDetails`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.IsSuccess) {
          setDashboardData(response.data.Result);
          setAvailability(response.data.Result.tutor.isAvailable);
        }
      } catch (error) {
        toast.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    // Fetch upcoming sessions
    const fetchUpcomingSessions = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/api/sessions/upcomingSessions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200 && response.data) {
          if (Array.isArray(response.data.Result)) {
            setUpcomingSessions(response.data.Result);
          } else {
            setUpcomingSessions([response.data.Result]);
          }
        } else {
          setUpcomingSessions([]);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 400) {
            setUpcomingSessions([]);
          } else {
            toast.error(
              error.response?.data?.message ||
                "Failed to load upcoming sessions"
            );
          }
        } else {
          console.error("Error fetching sessions:", error);
          toast.error("Failed to load upcoming sessions");
        }
        setUpcomingSessions([]);
      }
    };

    fetchDashboardData();
    fetchUpcomingSessions();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh sessions every minute
    const sessionInterval = setInterval(fetchUpcomingSessions, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(sessionInterval);
    };
  }, [setLoading, token]);

  const isSessionActive = (session) => {
    if (!session?.timeSlotDetails?.startTime) return false;

    const now = new Date();

    const [startTimeStr, startPeriod] =
      session.timeSlotDetails.startTime.split(" ");
    const [startHour, startMinute] = startTimeStr
      .split(":")
      .map((num) => parseInt(num));

    const sessionStart = new Date(now);
    sessionStart.setHours(
      startPeriod === "PM" && startHour !== 12
        ? startHour + 12
        : startPeriod === "AM" && startHour === 12
        ? 0
        : startHour,
      startMinute,
      0
    );

    // Calculate 5 minutes before and after
    const fiveMinsBefore = new Date(sessionStart);
    fiveMinsBefore.setMinutes(sessionStart.getMinutes() - 5);

    const fiveMinsAfter = new Date(sessionStart);
    fiveMinsAfter.setMinutes(sessionStart.getMinutes() + 5);

    // Check if current time is within the window
    // const isActive = now >= fiveMinsBefore && now <= fiveMinsAfter;

    // for testing purpose
    const isActive = true;

    return isActive;
  };

  const toggleAvailability = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await axios.put(
        `${baseUrl}/api/tutors/toogleAvailability`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.IsSuccess) {
        setAvailability(!availability);
        toast.success(
          `Availability changed to ${
            !availability ? "Available" : "Unavailable"
          }`
        );
      }
    } catch (error) {
      toast.error("Failed to change availability");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleJoinSession = (session) => {
    if (!session?.timeSlotDetails) {
      toast.error("Session details not found");
      return;
    }

    const roomId = session.timeSlotDetails._id;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      navigate(`/Session`, {
        state: {
          roomId: roomId,
          yourName: session.yourName,
          anotherPersonName: session.anotherPersonName,
        },
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-md">
      <Toaster richColors />
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {dashboardData?.tutor?.username || "Tutor"}! 👋
              </h1>
              <p className="text-blue-100 mt-1">
                {formatDate(currentTime)} | {formatTime(currentTime)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {availability && (
                <button
                  onClick={() => setIsTimeSlotModalOpen(true)}
                  className="px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 bg-white text-blue-700 hover:bg-blue-50 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Create Time Slot
                </button>
              )}
              <button
                onClick={toggleAvailability}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  availability
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                } hover:shadow-lg hover:-translate-y-0.5`}
              >
                {availability ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Available
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Unavailable
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">124</h3>
            <p className="text-gray-600">Total Students</p>
            <div className="mt-2 text-sm text-green-500">
              +12% from last month
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">48</h3>
            <p className="text-gray-600">Active Sessions</p>
            <div className="mt-2 text-sm text-green-500">
              +5% from last week
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">4.8</h3>
            <p className="text-gray-600">Average Rating</p>
            <div className="mt-2 text-sm text-blue-500">
              Based on 96 reviews
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-500" />
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">28</h3>
            <p className="text-gray-600">New Messages</p>
            <div className="mt-2 text-sm text-gray-500">
              Last updated 5m ago
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                  Upcoming Sessions
                </h2>
                <Link
                  to="/schedule"
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 hover:shadow-sm transition-all"
                    >
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <CalendarCheck className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">
                          {session.bookName || "Tutoring Session"}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {session.anotherPersonName || "Student"}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {session.timeSlotDetails?.startTime} -{" "}
                          {session.timeSlotDetails?.endTime}
                        </div>
                      </div>
                      {isSessionActive(session) ? (
                        <button
                          onClick={() => handleJoinSession(session)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded-lg transition-colors shadow-sm hover:shadow flex items-center"
                        >
                          <Video className="w-4 h-4 mr-1.5" />
                          Join Call
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-300 text-gray-600 px-4 py-2 text-sm rounded-lg flex items-center cursor-not-allowed"
                        >
                          <Video className="w-4 h-4 mr-1.5" />
                          Not Available
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="text-gray-500 mb-3">
                    You have no upcoming sessions.
                  </div>
                  <button
                    onClick={() => setIsTimeSlotModalOpen(true)}
                    className="mt-2 bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow"
                  >
                    Create Time Slot
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">
                  {dashboardData?.tutor?.username?.charAt(0) || "T"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {dashboardData?.tutor?.username || "Tutor Name"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {dashboardData?.tutor?.email || "tutor@example.com"}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <Link
                  to="/profile"
                  className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Slot Modal */}
      {isTimeSlotModalOpen && (
        <TimeSlotModal
          isOpen={isTimeSlotModalOpen}
          onClose={() => setIsTimeSlotModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TutorDashboard;
