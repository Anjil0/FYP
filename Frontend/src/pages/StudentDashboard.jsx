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
} from "lucide-react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import baseUrl from "../config/config";
import { useNavigate } from "react-router-dom";
import { useLoading } from "./../config/LoadingContext";

const StudentDashboard = () => {
  const token = localStorage.getItem("accessToken");
  const { setLoading } = useLoading();
  const [upcomingSession, setUpcomingSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch upcoming sessions
    const fetchUpcomingSession = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/api/sessions/upcomingSessions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200 && response.data && response.data.IsSuccess) {
          // Based on the provided API response structure
          setUpcomingSession(response.data.Result);
        } else {
          setUpcomingSession(null);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 400) {
            setUpcomingSession(null);
          } else {
            toast.error(
              error.response?.data?.ErrorMessage ||
                "Failed to load upcoming sessions"
            );
          }
        } else {
          console.error("Error fetching sessions:", error);
          toast.error("Failed to load upcoming sessions");
        }
        setUpcomingSession(null);
      }
    };

    fetchUpcomingSession();

    const interval = setInterval(fetchUpcomingSession, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const isSessionActive = (session) => {
    if (!session?.timeSlotDetails?.startTime) return false;

    const now = new Date();

    const [startTimeStr, startPeriod] = session.timeSlotDetails.startTime.split(" ");
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

    // For testing purposes,
    const isActive = true;
    
    return isActive;
  };

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

  const generateRoomIdForSession = (session) => {
    return `${session.timeSlotDetails._id}`;
  };

  const renderUpcomingSession = () => {
    if (!upcomingSession) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-gray-500 mb-3">
            There are no upcoming sessions.
          </div>
          <button className="mt-2 bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow">
            Find a tutor
          </button>
        </div>
      );
    }

    const { timeSlotDetails, bookName } = upcomingSession;

    return (
      <div className="border border-blue-100 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow transition-all">
      <Toaster richColors />
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-blue-800">{bookName}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Clock className="w-4 h-4 mr-1.5" />
              {timeSlotDetails.startTime} - {timeSlotDetails.endTime}
            </div>
          </div>
          <div>
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full mb-3 font-medium">
                <Video className="w-3 h-3 mr-1.5" />
                Video Session
              </span>
              {isSessionActive(upcomingSession) ? (
                <button
                  onClick={() => handleJoinSession(upcomingSession)}
                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 text-sm rounded-lg transition-colors shadow-sm hover:shadow flex items-center"
                >
                  Join Call <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-300 text-gray-600 px-5 py-2 text-sm rounded-lg flex items-center cursor-not-allowed"
                >
                  Not Available <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-6 mb-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Welcome to Your Dashboard</h1>
          <p className="text-blue-100">
            Track your learning progress and upcoming sessions
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Upcoming Sessions
                </div>
                <span className="text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center">
                  View all <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
            <div className="p-4">{renderUpcomingSession()}</div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  Messages
                </div>
                <span className="text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center">
                  View all <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  TM
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Thomas M.</div>
                  <div className="text-sm text-gray-500 truncate">
                    Hi, welcome to TutorEase! How can I help...
                  </div>
                </div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
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
                <span className="text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center">
                  View all <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <User className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-gray-500 mb-3">
                  You have not had a session with a tutor yet.
                </div>
                <button className="mt-2 bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow">
                  Get Help Finding a Tutor
                </button>
              </div>
            </div>
          </div>

          {/* Past Assignments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                  <Book className="w-5 h-5 text-blue-500" />
                  Past Assignments
                </div>
                <span className="text-sm text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center">
                  View all <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <Book className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-gray-500">
                  There are no past assignments.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Classroom Card */}
        <div className="mt-6">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-600 flex items-center justify-between">
              <div className="font-semibold text-lg flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-300" />
                Digital Classroom
              </div>
              <button className="text-sm bg-blue-500 hover:bg-blue-600 px-4 py-1.5 rounded-lg transition-colors">
                Explore
              </button>
            </div>
            <div className="p-6 flex items-center">
              <div className="mr-6">
                <p className="mb-4">
                  Get familiar with all the tools and features inside the
                  digital classroom before you start a session.
                </p>
                <button className="bg-white text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                  Take a Tour
                </button>
              </div>
              <div className="hidden md:block w-24 h-24 bg-blue-500 bg-opacity-20 rounded-full items-center justify-center">
                <Video className="w-12 h-12 text-blue-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;