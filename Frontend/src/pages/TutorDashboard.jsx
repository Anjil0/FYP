/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";

const TutorDashboard = () => {
  const { setLoading } = useLoading();
  const [dashboardData, setDashboardData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [availability, setAvailability] = useState();
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);

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

    fetchDashboardData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [setLoading,token]);

  const toggleAvailability = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 4000));
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back, {dashboardData?.tutor?.username || "Tutor"}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                {formatDate(currentTime)} | {formatTime(currentTime)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {availability && (
                <button
                  onClick={() => setIsTimeSlotModalOpen(true)}
                  className="px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Create Time Slot
                </button>
              )}
              <button
                onClick={toggleAvailability}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  availability
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
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
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <CalendarCheck className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        Mathematics - Grade 10
                      </h4>
                      <p className="text-gray-600 text-sm">John Smith</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800">2:00 PM</p>
                      <p className="text-gray-500 text-sm">Today</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Recent Activities
                </h2>
                <button className="text-blue-500 hover:text-blue-600">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {[
                  {
                    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                    title: "Session Completed",
                    description: "Physics with Sarah Johnson",
                    time: "2 hours ago",
                  },
                  {
                    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
                    title: "New Message",
                    description: "From Mike Anderson",
                    time: "4 hours ago",
                  },
                  {
                    icon: <Star className="w-5 h-5 text-yellow-500" />,
                    title: "New Review",
                    description: "5 stars from Emily Clark",
                    time: "Yesterday",
                  },
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="p-2 bg-white rounded-full shadow-sm">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {activity.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Profile Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <img
                    src="https://via.placeholder.com/96"
                    alt="Profile"
                    className="rounded-full w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  {dashboardData?.user?.username || "Anjil0"}
                </h3>
                <p className="text-gray-600">Mathematics & Physics Tutor</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">156</div>
                  <div className="text-sm text-gray-600">Hours Taught</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">4.9</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
              <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Edit Profile
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: <Calendar className="w-5 h-5" />,
                    text: "Schedule Session",
                  },
                  {
                    icon: <FileText className="w-5 h-5" />,
                    text: "Create Invoice",
                  },
                  {
                    icon: <MessageSquare className="w-5 h-5" />,
                    text: "Send Message",
                  },
                  {
                    icon: <Settings className="w-5 h-5" />,
                    text: "Settings",
                  },
                ].map((action, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {action.icon}
                    <span>{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <TimeSlotModal
        isOpen={isTimeSlotModalOpen}
        onClose={() => setIsTimeSlotModalOpen(false)}
        currentUser="Anjil0"
      />
    </div>
  );
};

export default TutorDashboard;
