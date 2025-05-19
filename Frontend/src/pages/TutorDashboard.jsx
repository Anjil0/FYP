/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
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
  PenLine,
  ArrowUpRight,
  DollarSign,
  FileSpreadsheet,
  Award,
  Wallet,
  GraduationCap,
  BookText,
  TrendingDown,
} from "lucide-react";

// Import the recharts components for the charts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TutorDashboard = () => {
  const { setLoading } = useLoading();
  const [dashboardData, setDashboardData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [availability, setAvailability] = useState(false);
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [earningsData, setEarningsData] = useState(null);
  const [earningsTimeRange, setEarningsTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("sessions");
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [tutorTips, setTutorTips] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");

  // Fetch dashboard data function
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseUrl}/api/Tdashboard/getTutorDashboardDetails`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess) {
        const result = response.data.Result;
        setDashboardData(result);
        setAvailability(result.tutor.isAvailable);
        setRecentAssignments(result.recentAssignments || []);
        setUpcomingSessions(result.upcomingBookings || []);
        setTutorTips(result.tutorTips || []);
      }
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, token]);

  // Fetch earnings data
  const fetchEarningsData = useCallback(async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/Tdashboard/earningsStats?range=${earningsTimeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess) {
        setEarningsData(response.data.Result);
      }
    } catch (error) {
      console.error("Error fetching earnings data:", error);
    }
  }, [token, earningsTimeRange]);

  // Fetch upcoming sessions
  const fetchUpcomingSessions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/Tdashboard/upcomingSessions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200 && response.data && response.data.IsSuccess) {
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
            error.response?.data?.message || "Failed to load upcoming sessions"
          );
        }
      } else {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load upcoming sessions");
      }
      setUpcomingSessions([]);
    }
  }, [token]);

  // Initialize data on component mount
  useEffect(() => {
    fetchDashboardData();
    fetchEarningsData();
    fetchUpcomingSessions();

    // Set up clock timer
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh sessions every minute
    const sessionInterval = setInterval(fetchUpcomingSessions, 20000);

    return () => {
      clearInterval(timer);
      clearInterval(sessionInterval);
    };
  }, [fetchDashboardData, fetchEarningsData, fetchUpcomingSessions]);

  // Effect for earnings time range change
  useEffect(() => {
    fetchEarningsData();
  }, [earningsTimeRange, fetchEarningsData]);

  // Effect for tip rotation
  useEffect(() => {
    if (tutorTips.length === 0) return;

    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tutorTips.length);
    }, 120000);

    return () => clearInterval(tipInterval);
  }, [tutorTips]);

  // Check if a session is active (can be joined)
  const isSessionActive = (session) => {
    const startTimeStr = session?.timeSlotDetails?.startTime;
    const endTimeStr = session?.timeSlotDetails?.endTime;
    const today = new Date();

    if (!startTimeStr || !endTimeStr) return false;

    const todayDay = today
      .toLocaleDateString("en-US", { weekday: "long" })
      .slice(0, 3);
    const sessionDay = session.dayName.slice(0, 3);
    console.log("Today's Day:", todayDay);
    console.log("Session Day:", sessionDay);
    if (todayDay !== sessionDay) return false;

    const datePart = today.toISOString().split("T")[0];

    const convertTo24Hr = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":");

      if (modifier === "PM" && hours !== "12") {
        hours = parseInt(hours, 10) + 12;
      }
      if (modifier === "AM" && hours === "12") {
        hours = "00";
      }

      return `${String(hours).padStart(2, "0")}:${minutes}:00`;
    };

    const sessionStart = new Date(`${datePart}T${convertTo24Hr(startTimeStr)}`);
    const sessionEnd = new Date(`${datePart}T${convertTo24Hr(endTimeStr)}`);

    const fiveMinsBeforeStart = new Date(
      sessionStart.getTime() - 5 * 60 * 1000
    );
    const fiveMinsAfterEnd = new Date(sessionEnd.getTime() + 5 * 60 * 1000);

    // Debug logs
    console.log("Now:", today.toLocaleString());
    console.log(
      "Allowed Join Window:",
      fiveMinsBeforeStart.toLocaleString(),
      "-",
      fiveMinsAfterEnd.toLocaleString()
    );

    return today >= fiveMinsBeforeStart && today <= fiveMinsAfterEnd;
    // return true;
  };

  // Toggle availability
  const toggleAvailability = async () => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${baseUrl}/api/Tdashboard/toggleAvailability`,
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

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: "short", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Generate a unique room ID for the session
  const generateRoomIdForSession = (session) => {
    console.log(session);
    return `${session._id}_${session.timeSlotDetails._id}`;
  };

  // Handle joining a session
  const handleJoinSession = (session) => {
    if (!session?.timeSlotDetails) {
      toast.error("Session details not found");
      return;
    }

    const roomId = generateRoomIdForSession(session);
    setLoading(true);

    console.log(session);
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

  // Sample data for charts when real data isn't loaded yet
  const sampleEarningsData = [
    { month: "Jan", earnings: 1200, bookings: 12 },
    { month: "Feb", earnings: 1800, bookings: 16 },
    { month: "Mar", earnings: 1600, bookings: 14 },
    { month: "Apr", earnings: 2400, bookings: 20 },
    { month: "May", earnings: 2200, bookings: 18 },
    { month: "Jun", earnings: 3000, bookings: 24 },
  ];

  const sampleSubjectData = [
    { name: "Mathematics", value: 40 },
    { name: "Physics", value: 25 },
    { name: "Chemistry", value: 15 },
    { name: "Biology", value: 20 },
  ];

  // Default tutor tips when API doesn't return any
  const defaultTutorTips = [
    {
      id: 1,
      tip: "Boost student engagement by providing specific, actionable feedback on assignments. Highlight what they did well and suggest concrete improvements.",
    },
    {
      id: 2,
      tip: "Use visual aids and real-world examples to explain complex concepts. This helps students make connections and retain information better.",
    },
    {
      id: 3,
      tip: "Start each session with a quick review of previous material. This reinforces learning and helps identify any concepts that need clarification.",
    },
    {
      id: 4,
      tip: "Encourage students to explain concepts back to you in their own words. This technique, known as the 'teach-back' method, improves comprehension.",
    },
    {
      id: 5,
      tip: "Customize your teaching approach to match each student's learning style. Some students learn best visually, others through discussion or practice problems.",
    },
  ];

  // Colors for pie chart
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82ca9d",
  ];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    const numericValue = parseFloat(value);
    return !isNaN(numericValue) ? `${numericValue}%` : "0%";
  };

  // Determine if a growth rate is positive or negative
  const isPositiveGrowth = (rate) => {
    const numericRate = parseFloat(rate);
    return !isNaN(numericRate) && numericRate >= 0;
  };

  // Prepare data for charts
  const monthlyStatsData = dashboardData?.monthlyStats || sampleEarningsData;
  const subjectDistributionData =
    dashboardData?.subjectDistribution?.map((subject) => ({
      name: subject._id,
      value: subject.count,
    })) || sampleSubjectData;

  // Get current tip
  const tipsToShow = tutorTips.length > 0 ? tutorTips : defaultTutorTips;
  const currentTip =
    tipsToShow[currentTipIndex]?.tip || defaultTutorTips[0].tip;

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
              {isPositiveGrowth(dashboardData?.stats?.studentGrowthRate) ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {dashboardData?.stats?.totalStudents || 0}
            </h3>
            <p className="text-gray-600">Total Students</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-500" />
              </div>
              {isPositiveGrowth(dashboardData?.stats?.sessionGrowthRate) ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {dashboardData?.stats?.activeSessions || 0}
            </h3>
            <p className="text-gray-600">Active Sessions</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {dashboardData?.stats?.averageRating || 0}
            </h3>
            <p className="text-gray-600">Average Rating</p>
            <div className="mt-2 text-sm text-blue-500">
              Based on {dashboardData?.stats?.totalReviews || 0} reviews
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-500" />
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {dashboardData?.stats?.newMessages || 0}
            </h3>
            <p className="text-gray-600">New Messages</p>
            <div className="mt-2 text-sm text-gray-500">
              Last updated {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8 border border-gray-100">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm ${
                activeTab === "sessions"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Upcoming Sessions
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm ${
                activeTab === "assignments"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BookText className="w-4 h-4" />
              Assignments
            </button>
            <button
              onClick={() => setActiveTab("earnings")}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm ${
                activeTab === "earnings"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Earnings
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm ${
                activeTab === "analytics"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content based on active tab */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions Tab */}
            {activeTab === "sessions" && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                    Upcoming Sessions
                  </h2>
                </div>

                {upcomingSessions && upcomingSessions.length > 0 ? (
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
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-800">
                              {session.bookName || "Tutoring Session"}
                            </h4>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {session.dayName}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {session.anotherPersonName ||
                              session.studentName ||
                              "Student"}
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
            )}

            {/* Assignments Tab */}
            {activeTab === "assignments" && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <BookText className="w-5 h-5 text-blue-500 mr-2" />
                    Recent Assignments
                  </h2>
                  <Link
                    to="/tutorAssignment"
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {recentAssignments && recentAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {recentAssignments.map((assignment, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 hover:shadow-sm transition-all"
                      >
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <FileText className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {assignment.title}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {assignment.subject}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              Due:{" "}
                              {new Date(
                                assignment.dueDate
                              ).toLocaleDateString()}
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                assignment.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : assignment.status === "submitted"
                                  ? "bg-blue-100 text-blue-700"
                                  : assignment.status === "reviewed"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {assignment.status.charAt(0).toUpperCase() +
                                assignment.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/assignments/${assignment._id}`}
                          className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-1 flex items-center"
                        >
                          <span>View</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-gray-500 mb-3">
                      You have no recent assignments.
                    </div>
                    <Link
                      to="/assignments/create"
                      className="mt-2 bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow flex items-center gap-2"
                    >
                      <PenLine className="w-4 h-4" />
                      Create Assignment
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === "earnings" && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                    Your Earnings
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEarningsTimeRange("week")}
                      className={`px-3 py-1 text-xs rounded-lg ${
                        earningsTimeRange === "week"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setEarningsTimeRange("month")}
                      className={`px-3 py-1 text-xs rounded-lg ${
                        earningsTimeRange === "month"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setEarningsTimeRange("year")}
                      className={`px-3 py-1 text-xs rounded-lg ${
                        earningsTimeRange === "year"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Year
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-600 text-sm">Total Earnings</h3>
                      <Wallet className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {formatCurrency(earningsData?.totalEarnings || 0)}
                    </div>
                    <div
                      className={`mt-1 text-xs ${
                        isPositiveGrowth(earningsData?.earningsGrowthRate)
                          ? "text-green-500"
                          : "text-red-500"
                      } flex items-center`}
                    >
                      {isPositiveGrowth(earningsData?.earningsGrowthRate) ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {isPositiveGrowth(earningsData?.earningsGrowthRate)
                        ? "+"
                        : ""}
                      {formatPercentage(earningsData?.earningsGrowthRate || 0)}{" "}
                      change
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-white p-5 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-600 text-sm">Total Bookings</h3>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {earningsData?.totalBookings || 0}
                    </div>
                    <div
                      className={`mt-1 text-xs ${
                        isPositiveGrowth(earningsData?.bookingsGrowthRate)
                          ? "text-green-500"
                          : "text-red-500"
                      } flex items-center`}
                    >
                      {isPositiveGrowth(earningsData?.bookingsGrowthRate) ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {isPositiveGrowth(earningsData?.bookingsGrowthRate)
                        ? "+"
                        : ""}
                      {formatPercentage(earningsData?.bookingsGrowthRate || 0)}{" "}
                      change
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Monthly Earnings
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-100 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyStatsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="earnings" fill="#4F46E5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Earnings By Subject
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-100 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subjectDistributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {subjectDistributionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                    Performance Analytics
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-600 text-sm">
                          Session Rating
                        </h3>
                        <div className="text-xl font-bold text-gray-800 mt-1">
                          {dashboardData?.stats?.averageRating || 0}/5.0
                        </div>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Star className="w-5 h-5 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-lg border border-purple-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-600 text-sm">
                          Completion Rate
                        </h3>
                        <div className="text-xl font-bold text-gray-800 mt-1">
                          {dashboardData?.stats?.completionRate || 0}%
                        </div>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-lg border border-green-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-600 text-sm">
                          Repeat Students
                        </h3>
                        <div className="text-xl font-bold text-gray-800 mt-1">
                          {dashboardData?.stats?.repeatStudentRate || 0}%
                        </div>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Session Trends
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-100 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyStatsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="bookings"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Subject Distribution
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-100 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subjectDistributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {subjectDistributionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold overflow-hidden">
                  {dashboardData?.tutor?.image ? (
                    <img
                      src={dashboardData.tutor.image}
                      alt={dashboardData.tutor.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    dashboardData?.tutor?.username?.charAt(0) || "T"
                  )}
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

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-gray-600 text-sm">
                  <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                  Education:{" "}
                  {dashboardData?.tutor?.education ||
                    "Education information not available"}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <Award className="w-4 h-4 mr-2 text-gray-500" />
                  Experience:{" "}
                  {dashboardData?.tutor?.teachingExperience ||
                    "Information not available"}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                  Address:{" "}
                  {dashboardData?.tutor?.address || "Information not available"}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <Link
                  to="/tutorProfile"
                  className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsTimeSlotModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Create Time Slot</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <Link
                  to="/assignments/create"
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center">
                    <PenLine className="w-4 h-4 mr-2" />
                    <span>New Assignment</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/tutorChat"
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span>View Messages</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Daily Tips - Now with rotating tips */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Tutor Tip</h3>
                <Lightbulb className="w-5 h-5 text-yellow-300" />
              </div>
              <p className="text-sm text-blue-50 mb-3">{currentTip}</p>
              <div className="flex justify-center mt-2">
                {tipsToShow.map((tip, index) => (
                  <span
                    key={tip.id}
                    className={`w-2 h-2 mx-1 rounded-full ${
                      currentTipIndex === index ? "bg-white" : "bg-blue-300"
                    }`}
                  />
                ))}
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
