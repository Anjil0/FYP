import { useState, useEffect } from "react";
import { MessageCircle, Book, User, Calendar, Video } from "lucide-react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import baseUrl from "../config/config";
import { isWithinTimeRange } from "../authUtils/timeUtils";

const StudentDashboard = () => {
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentSession = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/api/sessions/upcomingSessions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (response.status === 200 && response.data) {
          console.log("Session data:", response.data);
          setCurrentSession({
            timeSlotDetails: response.data.Result.timeSlotDetails,
            bookName: response.data.Result.bookName,
            joinUrl: `https://meet.google.com/session/`,
          });
        } else {
          setCurrentSession(null);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            setCurrentSession(null);
          } else {
            toast.error(
              error.response?.data?.message || "Failed to load upcoming session"
            );
          }
        } else {
          console.error("Error fetching session:", error);
          toast.error("Failed to load upcoming session");
        }
        setCurrentSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSession();
    const interval = setInterval(fetchCurrentSession, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinSession = (session) => {
    if (!session?.timeSlotDetails) {
      toast.error("Session details not found");
      return;
    }

    const canJoin = isWithinTimeRange(
      session.timeSlotDetails.startTime,
      session.timeSlotDetails.endTime
    );

    if (canJoin) {
      window.open(session.joinUrl, "_blank");
      toast.success(`Joining session: ${session.bookName}`);
    } else {
      toast.info("This session is not available to join yet");
    }
  };

  const renderUpcomingSession = () => {
    if (loading) {
      return <div className="text-gray-500">Loading session...</div>;
    }

    if (!currentSession) {
      return (
        <>
          <div className="text-gray-500">There are no upcoming sessions.</div>
          <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full">
            Find a tutor
          </button>
        </>
      );
    }

    const { timeSlotDetails, bookName } = currentSession;
    const canJoin = isWithinTimeRange(
      timeSlotDetails.startTime,
      timeSlotDetails.endTime
    );

    return (
      <div className="border rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">{bookName}</h3>
            <div className="text-sm text-gray-500">
              {timeSlotDetails.startTime} - {timeSlotDetails.endTime}
            </div>
          </div>
          <div>
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                <Video className="w-3 h-3 mr-1" />
                Video Session
              </span>
              <button
                onClick={() => handleJoinSession(currentSession)}
                className={`${
                  canJoin
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-400 cursor-not-allowed"
                } text-white px-4 py-1.5 text-sm rounded-lg transition-colors`}
                disabled={!canJoin}
              >
                {canJoin ? "Join Call" : "Not Available"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <Calendar className="w-5 h-5" />
                Upcoming Sessions
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">{renderUpcomingSession()}</div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <MessageCircle className="w-5 h-5" />
                Messages
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="font-medium">Thomas M.</div>
                <div className="text-sm text-gray-500 truncate">
                  Hi, welcome to TutorEase! How can I help...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Tutors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <User className="w-5 h-5" />
                My Tutors
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-gray-500">
              You have not had a session with a tutor yet.
            </div>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full">
              Get Help Finding a Tutor
            </button>
          </div>
        </div>

        {/* Past Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <Book className="w-5 h-5" />
                Past Assignments
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-gray-500">There are no past assignments.</div>
          </div>
        </div>
      </div>

      {/* Digital Classroom Card */}
      <div className="mt-6">
        <div className="bg-gray-700 text-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-600">
            <div className="font-semibold text-lg">Digital Classroom</div>
          </div>
          <div className="p-4">
            <p>
              Get familiar with all the tools and features inside the digital
              classroom before you start a session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
