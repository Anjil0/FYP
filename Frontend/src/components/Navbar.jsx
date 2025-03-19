/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, UserCircle, Bell, CheckCheck } from "lucide-react";
import axios from "axios";
import baseUrl from "./../config/config";
import { isValidToken } from "../authUtils/authUtils";
import { useLocation } from "react-router-dom";
import socket from "../socket";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";

const NotificationButton = ({
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  handleNotificationClick,
  markAllAsRead,
}) => (
  <div className="relative notifications-container">
    <button
      onClick={() => setShowNotifications(!showNotifications)}
      className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors relative"
    >
      <Bell size={24} className="text-blue-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
    {showNotifications && (
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors
                  ${notification.isRead ? "bg-white" : "bg-blue-50"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Bell className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(
                        new Date(notification.createdAt),
                        "MMM d, yyyy HH:mm"
                      )}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("accessToken");

  const markAllAsRead = async () => {
    try {
      await axios.post(
        `${baseUrl}/api/notifications/markAllAsRead`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    let path;
    switch (notification.type) {
      case "booking":
        path = userRole === "tutor" ? "/tutorBookingReq" : "/Mybookings";
        break;
      case "message":
        path = userRole === "tutor" ? "/tutorChat" : "/stdChat";
        break;
      case "payment":
        path = "/earnings";
        break;
      default:
        return;
    }

    if (window.location.pathname === path) {
      window.location.reload();
    } else {
      navigate(path);
    }

    setShowNotifications(false);
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.success(notification.message, {
        duration: 5000,
      });
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchNotifications = async () => {
        try {
          const response = await axios.get(
            `${baseUrl}/api/notifications/getAllNotificationByUser`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.StatusCode === 200) {
            setNotifications(response.data.Result.data);
            setUnreadCount(response.data.Result.unreadCount);
          } else {
            console.error(
              "Error fetching notifications:",
              response.data.ErrorMessage
            );
          }
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      };
      fetchNotifications();
    }
  }, [token, isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showNotifications &&
        !event.target.closest(".notifications-container")
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // for reset Timer
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("accessToken");
      const role = localStorage.getItem("userRole");
      if (token) {
        const isValid = isValidToken(token);
        setIsLoggedIn(isValid);
        setUserRole(role);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };

    checkToken();
    if (location.pathname !== "/verify") {
      localStorage.removeItem("resendTimer");
      localStorage.removeItem("resendTimestamp");
    }
    if (location.pathname !== "/tutorSignup") {
      localStorage.removeItem("signupFormData");
      localStorage.removeItem("signupStep");
    }
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${baseUrl}/api/users/logout`,
        {},
        {
          withCredentials: true,
        }
      );

      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");

      setIsLoggedIn(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
      setIsLoggedIn(false);
      navigate("/");
    }
  };

  const getNavItems = () => {
    if (userRole === "user") {
      return [
        { href: "/stdDashboard", text: "Dashboard" },
        { href: "/tutors", text: "Find Tutors" },
        { href: "/myAssignments", text: "My Assignments" },
        { href: "/stdChat", text: "Message" },
        { href: "/Mybookings", text: "My Bookings" },
      ];
    }

    if (userRole === "tutor") {
      return [
        { href: "/tutorDashboard", text: "Dashboard" },
        { href: "/tutorBookingReq", text: "My Bookings" },
        { href: "/students", text: "My Students" },
        { href: "/tutorChat", text: "Message" },
        { href: "/tutorTimeSlot", text: "TimeSlots" },
        { href: "/tutorAssignment", text: "Assignments" },
      ];
    }
    return [
      { href: "/", text: isLoggedIn ? "Dashboard" : "Home" },
      { href: "/tutors", text: "Tutors" },
      { href: "/aboutus", text: "About" },
      { href: "/tutorSignup", text: "Become a Tutor" },
    ];
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[4.5rem] items-center">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-blue-50 rounded-full blur group-hover:bg-blue-100 transition-colors duration-300 opacity-75"></div>
                <img
                  src="/Logo.png"
                  alt="TutorEase Logo"
                  className="h-[50px] w-[120px] relative transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </a>

            {/* Desktop Navigation */}
            <ul className="hidden md:flex ml-10 space-x-8">
              {getNavItems().map((link) => (
                <li key={link.text}>
                  <a
                    href={link.href}
                    className="relative text-gray-600 hover:text-blue-600 font-medium py-2 group transition-colors duration-200 flex items-center gap-1"
                  >
                    <span>{link.text}</span>
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {isLoggedIn && (
              <NotificationButton
                notifications={notifications}
                unreadCount={unreadCount}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                handleNotificationClick={handleNotificationClick}
                markAllAsRead={markAllAsRead}
              />
            )}

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() =>
                      navigate(
                        userRole === "tutor" ? "/tutorProfile" : "/stdProfile"
                      )
                    }
                    className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <UserCircle size={24} className="text-blue-600" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/signup"
                    className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold transition-all duration-200 hover:bg-blue-100 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-0.5"
                  >
                    Create Account
                  </a>
                  <a
                    href="/login"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800"
                  >
                    Sign In
                  </a>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={toggleMenu} className="md:hidden relative group">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                {isMenuOpen ? (
                  <X size={24} className="text-blue-600" />
                ) : (
                  <Menu size={24} className="text-blue-600" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "max-h-[400px] opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="py-4 space-y-4 px-2">
            {/* Mobile Navigation Links */}
            <ul className="space-y-1">
              {getNavItems().map((link) => (
                <li key={link.text}>
                  <a
                    href={link.href}
                    className="flex items-center px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>

            {/* Mobile Action Buttons */}
            <div className="grid grid-cols-2 gap-3 px-2">
              {isLoggedIn ? (
                <>
                  <button className="flex items-center justify-center px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold transition-all duration-200 hover:bg-blue-100 active:scale-95">
                    <UserCircle size={24} className="mr-2" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:from-blue-700 hover:to-blue-800 active:scale-95"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/signup"
                    className="text-center px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold transition-all duration-200 hover:bg-blue-100 active:scale-95"
                  >
                    Create Account
                  </a>
                  <a
                    href="/login"
                    className="text-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:from-blue-700 hover:to-blue-800 active:scale-95"
                  >
                    Sign In
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
