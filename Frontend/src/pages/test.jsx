import { useState, useEffect } from "react";
import {
  MessageCircle,
  Book,
  User,
  Calendar,
  Video,
  ChevronRight,
  Clock,
  Lightbulb,
  Award,
  CheckCircle,
  BarChart2,
  BookOpen,
  FileText,
  AlertCircle,
  CheckSquare,
  PieChart,
  Target,
  BookMarked,
  TrendingUp
} from "lucide-react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import baseUrl from "../config/config";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../config/LoadingContext";

const StudentDashboard = () => {
  const token = localStorage.getItem("accessToken");
  const { setLoading } = useLoading();
  const navigate = useNavigate();

  // State variables
  const [dashboardData, setDashboardData] = useState({
    upcomingSessions: [],
    recentMessages: [],
    myTutors: [],
    pastAssignments: [],
    analytics: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: "short", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Calculate time remaining for session
  const getTimeRemaining = (startDate) => {
    const now = new Date();
    const sessionStart = new Date(startDate);
    const diffMs = sessionStart - now;

    if (diffMs <= 0) return "Starting now";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      return `in ${days} day${days > 1 ? "s" : ""}`;
    }

    if (diffHrs > 0) {
      return `in ${diffHrs} hr${diffHrs > 1 ? "s" : ""} ${diffMins % 60} min`;
    }

    return `in ${diffMins} min`;
  };

  // Check if a session is active (can be joined)
  const isSessionActive = (session) => {
    if (!session?.timeSlotDetails?.startTime) return false;

    const now = new Date();
    const sessionStart = new Date(session.startDate);

    // Calculate 5 minutes before and 15 minutes after
    const fiveMinsBefore = new Date(sessionStart);
    fiveMinsBefore.setMinutes(sessionStart.getMinutes() - 5);

    const fifteenMinsAfter = new Date(sessionStart);
    fifteenMinsAfter.setMinutes(sessionStart.getMinutes() + 15);

    // Check if current time is within the window
    return now >= fiveMinsBefore && now <= fifteenMinsAfter;
  };

  // Handle joining a session
  const handleJoinSession = (session) => {
    if (!session?.timeSlotDetails) {
      toast.error("Session details not found");
      return;
    }

    const roomId = generateRoomIdForSession(session);
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

  // Generate a unique room ID for the session
  const generateRoomIdForSession = (session) => {
    return `${session._id}_${session.timeSlotDetails._id}`;
  };

  // Navigate to tutor profile
  const handleViewTutor = (tutorId) => {
    navigate(`/tutors/${tutorId}`);
  };

  // Navigate to message thread
  const handleViewMessage = (bookingId) => {
    navigate(`/stdChat/`);
  };

  // Navigate to assignment details
  const handleViewAssignment = (assignmentId) => {
    navigate(`/stdAssignment/${assignmentId}`);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${baseUrl}/api/dashboard/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (
          response.status === 200 &&
          response.data &&
          response.data.IsSuccess
        ) {
          setDashboardData(response.data.Result);
          setError(null);
        } else {
          setError("Failed to load dashboard data");
          toast.error("Failed to load dashboard data");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
        toast.error(
          error.response?.data?.ErrorMessage || "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, [token]);

  // Render dashboard content
  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <Toaster position="top-right" richColors />

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-10 px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-3">Welcome to Your Dashboard</h1>
          <p className="text-blue-100 max-w-lg">
            Track your learning journey, upcoming sessions, and connect with
            tutors all in one place.
          </p>

          {/* Quick Stats */}
          {!isLoading && dashboardData.analytics && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 bg-opacity-30 p-2 rounded-md">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-100">
                      Total Sessions
                    </p>
                    <p className="text-xl font-bold text-white">
                      {dashboardData.analytics.totalSessions || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500 bg-opacity-30 p-2 rounded-md">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-100">
                      Subjects
                    </p>
                    <p className="text-xl font-bold text-white">
                      {dashboardData.myTutors.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-500 bg-opacity-30 p-2 rounded-md">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-100">
                      Session Completion
                    </p>
                    <p className="text-xl font-bold text-white">
                      {dashboardData.analytics.completionRate || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        // Loading skeleton
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4"
              >
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to load dashboard
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      ) : (
        // Dashboard content
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Upcoming Sessions
                  </div>
                </div>
              </div>
              <div className="p-4">
                {dashboardData.upcomingSessions &&
                dashboardData.upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.upcomingSessions.map((session, index) => (
                      <div
                        key={index}
                        className="border border-blue-100 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-blue-800">
                              {session.bookName}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Clock className="w-4 h-4 mr-1.5" />
                              {session.timeSlotDetails.startTime} -{" "}
                              {session.timeSlotDetails.endTime}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Calendar className="w-4 h-4 mr-1.5" />
                              {formatDate(session.startDate)}
                              <span className="ml-2 text-blue-600 font-medium">
                                {getTimeRemaining(session.startDate)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4 mr-1.5" />
                              {session.tutorName}
                            </div>
                          </div>
                          <div>
                            <div className="flex flex-col items-end">
                              <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full mb-3 font-medium">
                                <Video className="w-3 h-3 mr-1.5" />
                                Video Session
                              </span>
                              {isSessionActive(session) ? (
                                <button
                                  onClick={() => handleJoinSession(session)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 text-sm rounded-lg transition-colors shadow-sm hover:shadow flex items-center"
                                >
                                  Join Call{" "}
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="bg-gray-300 text-gray-600 px-5 py-2 text-sm rounded-lg flex items-center cursor-not-allowed"
                                >
                                  Not Available{" "}
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <Calendar className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-gray-500 mb-3">
                      There are no upcoming sessions.
                    </div>
                    <button
                      onClick={() => navigate("/find-tutor")}
                      className="mt-2 bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow"
                    >
                      Find a tutor
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    Messages
                  </div>
                  <span
                    onClick={() => navigate("/stdChat")}
                    className="text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
              <div className="p-4">
                {dashboardData.recentMessages &&
                dashboardData.recentMessages.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentMessages.map((message, index) => (
                      <div
                        key={index}
                        onClick={() => handleViewMessage(message.bookingId)}
                        className="flex items-center gap-3 p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                          {message.tutorImage ? (
                            <img
                              src={message.tutorImage}
                              alt={message.tutorName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            message.tutorName.charAt(0) +
                            message.tutorName.split(" ")[1]?.charAt(0)
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {message.tutorName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {message.lastMessage}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </div>
                        </div>
                        {message.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                            {message.unreadCount}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <MessageCircle className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-gray-500 mb-3">
                      You have no messages yet.
                    </div>
                    <p className="text-sm text-gray-400 max-w-xs">
                      Messages will appear here after you book a session with a
                      tutor.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* My Tutors */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                    <User className="w-5 h-5 text-blue-500" />
                    My Tutors
                  </div>
                  <span
                    onClick={() => navigate("/Mybookings")}
                    className="text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
              <div className="p-4">
                {dashboardData.myTutors && dashboardData.myTutors.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.myTutors.map((tutor, index) => (
                      <div
                        key={index}
                        onClick={() => handleViewTutor(tutor._id)}
                        className="flex items-center gap-3 p-3 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-200">
                          {tutor.image ? (
                            <img
                              src={tutor.image}
                              alt={tutor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                              {tutor.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {tutor.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tutor.education}
                          </div>
                          {tutor.rating && (
                            <div className="flex items-center mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Award
                                    key={i}
                                    size={12}
                                    className={
                                      i < Math.round(tutor.rating)
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-500 ml-1">
                                ({tutor.totalRatings})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <User className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-gray-500 mb-3">
                      You have not had a session with a tutor yet.
                    </div>
                    <button
                      onClick={() => navigate("/find-tutor")}
                      className="mt-2 bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow"
                    >
                      Get Help Finding a Tutor
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Past Assignments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                    <Book className="w-5 h-5 text-blue-500" />
                    Assignments
                  </div>
                  <span
                    onClick={() => navigate("/stdAssignments")}
                    className="text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
              <div className="p-4">
                {dashboardData.pastAssignments &&
                dashboardData.pastAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.pastAssignments.map((assignment, index) => (
                      <div
                        key={index}
                        onClick={() => handleViewAssignment(assignment._id)}
                        className="p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-600">Completed</span>
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {dashboardData.analytics.assignmentStatusData?.completed || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Summary</h4>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Sessions Booked</span>
                        <span className="text-sm font-semibold text-blue-700">{dashboardData.analytics.totalSessions}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Assignments Completed</span>
                        <span className="text-sm font-semibold text-green-600">
                          {dashboardData.analytics.submittedAssignments} / {dashboardData.analytics.totalAssignments}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Spent</span>
                        <span className="text-sm font-semibold text-blue-700">
                          ${dashboardData.analytics.totalSpent?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-gray-500">
                      Complete a session to see your progress stats.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Books/Courses */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Recommended Resources
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="border border-blue-100 rounded-lg p-4 flex items-center gap-3 hover:bg-blue-50 transition-all cursor-pointer">
                    <div className="min-w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Learning Resources
                      </h4>
                      <p className="text-sm text-gray-500">
                        Access our practice sheets and videos
                      </p>
                    </div>
                  </div>

                  <div className="border border-blue-100 rounded-lg p-4 flex items-center gap-3 hover:bg-blue-50 transition-all cursor-pointer">
                    <div className="min-w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Study Tips</h4>
                      <p className="text-sm text-gray-500">
                        Improve your learning with effective techniques
                      </p>
                    </div>
                  </div>
                  
                  <div className="border border-blue-100 rounded-lg p-4 flex items-center gap-3 hover:bg-blue-50 transition-all cursor-pointer">
                    <div className="min-w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Practice Quizzes</h4>
                      <p className="text-sm text-gray-500">
                        Test your knowledge with our interactive quizzes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
-between items-start mb-2">
                          <h4 className="font-medium text-gray-800">
                            {assignment.title}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              assignment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : assignment.status === "submitted"
                                ? "bg-blue-100 text-blue-800"
                                : assignment.status === "reviewed"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {assignment.status.charAt(0).toUpperCase() +
                              assignment.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                          {assignment.subject}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          Due: {formatDate(assignment.dueDate)}
                        </div>
                        {assignment.grade && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Award className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
                            Grade: {assignment.grade}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <Book className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-gray-500">
                      There are no assignments yet.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Learning Progress Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Learning Progress
                </div>
              </div>
              <div className="p-4">
                {dashboardData.analytics ? (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="border border-gray-100 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          Sessions Completed
                        </div>
                        <div className="text-lg font-semibold text-gray-800">
                          {dashboardData.analytics.completedSessions || 0}/{dashboardData.analytics.totalSessions || 0}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${dashboardData.analytics.completionRate || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="border border-gray-100 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          Assignment Progress
                        </div>
                        <div className="text-lg font-semibold text-gray-800">
                          {dashboardData.analytics.submittedAssignments || 0}/{dashboardData.analytics.totalAssignments || 0}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${dashboardData.analytics.assignmentCompletionRate || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Assignment Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-600">Pending</span>
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {dashboardData.analytics.assignmentStatusData?.assigned || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-600">Submitted</span>
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {dashboardData.analytics.assignmentStatusData?.submitted || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-600">Reviewed</span>
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {dashboardData.analytics.assignmentStatusData?.reviewed || 0}
                          </span>
                        </div>
                        <div className="flex justify