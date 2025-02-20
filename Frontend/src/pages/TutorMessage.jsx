// TutorMessagePage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import baseUrl from "/src/config/config";
import { toast } from "sonner";
import {
  Send,
  MessageCircle,
  Check,
  CheckCheck,
  Search,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import socket from "../socket";
import { debounce } from "lodash";

const TutorMessagePage = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBookingId, setActiveBookingId] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const MessageList = () => (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message._id}
          className={`flex ${
            message.senderId === selectedStudent.studentId._id
              ? "justify-start"
              : "justify-end"
          }`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-5 py-3 ${
              message.senderId === selectedStudent.studentId._id
                ? "bg-gray-100 text-gray-800"
                : "bg-indigo-500 text-white"
            }`}
          >
            {message.imageUrl ? (
              <div className="mb-2">
                <img
                  src={message.imageUrl}
                  alt="Message attachment"
                  className="rounded-lg max-w-full h-auto shadow-sm"
                  style={{ maxHeight: "300px" }}
                />
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed">{message.content}</p>
            )}
            <div
              className={`text-xs mt-1.5 flex items-center gap-1.5 ${
                message.senderId === selectedStudent.studentId._id
                  ? "text-gray-500"
                  : "text-indigo-100"
              }`}
            >
              {format(new Date(message.createdAt), "HH:mm")}
              {message.senderId !== selectedStudent.studentId._id &&
                (message.read ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                ))}
            </div>
          </div>
        </div>
      ))}
      {isTyping && selectedStudent && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
  
  const MessageInput = () => (
    <form onSubmit={sendMessage} className="flex items-center gap-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <ImageIcon className="w-5 h-5 text-gray-500" />
      </button>
      <input
        type="text"
        value={newMessage}
        onChange={handleMessageChange}
        placeholder="Type your message..."
        className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-0
           focus:ring-2 focus:ring-indigo-500 focus:bg-white 
           transition-all text-sm"
      />
      <button
        type="submit"
        disabled={!newMessage.trim()}
        className="p-3 bg-indigo-500 rounded-xl text-white hover:bg-indigo-600 
                                 disabled:opacity-50 disabled:cursor-not-allowed 
                                 transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const debouncedTyping = useCallback(
    debounce(() => {
      socket.emit("stopTyping", { bookingId: activeBookingId });
    }, 1000),
    [activeBookingId]
  );

  useEffect(() => {
    return () => {
      debouncedTyping.cancel();
    };
  }, [debouncedTyping]);

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    socket.emit("typing", { bookingId: activeBookingId });
    debouncedTyping();
  };

  //   socket listerner
  useEffect(() => {
    // Message listener
    socket.on("newMessage", (message) => {
      if (message.bookingId === activeBookingId) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    // Online status listeners
    socket.on("updateOnlineUsers", (users) => {
      setOnlineUsers(new Set(users));
    });

    socket.on("userStatusChanged", ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Typing listeners
    socket.on("typing", ({ bookingId }) => {
      if (bookingId === activeBookingId) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", ({ bookingId }) => {
      if (bookingId === activeBookingId) {
        setIsTyping(false);
      }
    });

    // Cleanup
    return () => {
      socket.off("newMessage");
      socket.off("updateOnlineUsers");
      socket.off("userStatusChanged");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [activeBookingId]);

  const StatusIndicator = ({ userId, size = "small" }) => {
    const isOnline = onlineUsers.has(userId);
    const sizeClasses = size === "small" ? "h-3 w-3" : "h-4 w-4";

    return (
      <div
        className={`absolute bottom-0 right-0 ${sizeClasses} rounded-full 
          ${isOnline ? "bg-green-500" : "bg-gray-400"} 
          ring-2 ring-white transition-colors duration-300`}
        title={isOnline ? "Online" : "Offline"}
      />
    );
  };

  const TypingIndicator = () => (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex space-x-2 bg-gray-100 rounded-full px-4 py-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
      <span className="text-sm text-gray-500">Typing...</span>
    </div>
  );

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedStudent || !activeBookingId) return;

      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${baseUrl}/api/messages/messages/${activeBookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.IsSuccess) {
          setMessages(response.data.Result.messages);
          scrollToBottom();
        }
      } catch (error) {
        if (error.response && error.response.data) {
          const errorMessages = error.response.data.ErrorMessage.map(
            (err) => err.message
          ).join(", ");
          toast.error(`${errorMessages}`);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      }
    };

    fetchMessages();
  }, [selectedStudent, activeBookingId]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${baseUrl}/api/bookings/getTutorChatBookings`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.IsSuccess) {
          setStudents(
            response.data.Result.bookings.filter(
              (booking) => booking.status === "ongoing"
            )
          );
        }
      } catch (error) {
        if (error.response && error.response.data) {
          const errorMessages = error.response.data.ErrorMessage.map(
            (err) => err.message
          ).join(", ");
          toast.error(`${errorMessages}`);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudent || !activeBookingId) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${baseUrl}/api/messages/message/text`,
        {
          bookingId: activeBookingId,
          content: newMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.IsSuccess) {
        setMessages((prev) => [...prev, response.data.Result.message]);
        setNewMessage("");
        scrollToBottom();
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessages = error.response.data.ErrorMessage.map(
          (err) => err.message
        ).join(", ");
        toast.error(`${errorMessages}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload only image files (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("bookingId", activeBookingId);

      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${baseUrl}/api/messages/message/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.IsSuccess) {
        setMessages((prev) => [...prev, response.data.Result.message]);
        scrollToBottom();
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessages = error.response.data.ErrorMessage.map(
          (err) => err.message
        ).join(", ");
        toast.error(`${errorMessages}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const filteredStudents = students.filter((booking) =>
    booking.studentId?.username
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4.8rem)] bg-gradient-to-br from-indigo-50 to-gray-50">
      <div className="container mx-auto p-4 h-[calc(100vh-5rem)]">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full border border-gray-100">
          <div className="flex h-full">
            {/* Sidebar - Students List */}
            <div className="w-80 border-r border-gray-100 bg-white">
              {/* Search Header */}
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Students
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border-0
                             focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Students List */}
              <div className="overflow-y-auto h-[calc(100%-5rem)]">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="bg-indigo-50 p-4 rounded-full mb-4">
                      <MessageCircle className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">
                      No active students
                    </p>
                    <p className="text-sm text-gray-400">
                      Students will appear here when they book your sessions
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((booking) => (
                    <div
                      key={booking._id}
                      onClick={() => {
                        setSelectedStudent(booking);
                        setActiveBookingId(booking._id);
                      }}
                      className={`p-4 cursor-pointer transition-all hover:bg-gray-50
                        ${
                          selectedStudent?._id === booking._id
                            ? "bg-indigo-50/70 border-l-4 border-indigo-500"
                            : "border-l-4 border-transparent"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={booking.studentId?.image}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100"
                            alt={booking.studentId?.username}
                          />
                          <StatusIndicator userId={booking.studentId?._id} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {booking.studentId?.username}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {onlineUsers.has(booking.studentId?._id) ? (
                              <span className="text-green-500">Online</span>
                            ) : (
                              <span className="text-gray-400">Offline</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedStudent ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={selectedStudent.studentId?.image}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100"
                          alt={selectedStudent.studentId?.username}
                        />
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {selectedStudent.studentId?.username}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {" "}
                          {onlineUsers.has(selectedStudent.studentId?._id) ? (
                            <span className="text-green-500">Online</span>
                          ) : (
                            <span className="text-gray-400">Offline</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div
                    className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-6"
                    style={{ maxHeight: "calc(100vh - 13rem)" }}
                  >
                    <MessageList />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-white border-t border-gray-100">
                    <MessageInput />
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                  <div className="p-8 text-center">
                    <div className="bg-indigo-50 p-4 rounded-full inline-block mb-4">
                      <MessageCircle className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Start Teaching
                    </h3>
                    <p className="text-gray-500">
                      Select a student from the list to begin your session
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorMessagePage;
