import { useState, useEffect } from "react";
import { Send, Users, Info, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import socket from "../socket";
import axios from "axios";
import baseUrl from "../config/config";

const TutorAnnouncementPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [announcement, setAnnouncement] = useState({
    title: "",
    content: "",
    targetAudience: "all",
    selectedStudents: [],
  });

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${baseUrl}/api/bookings/tutorBookings`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (
          response.data &&
          response.data.Result &&
          response.data.Result.bookings
        ) {
          const activeBookings = response.data.Result.bookings.filter(
            (booking) => booking.status === "ongoing" && booking.isActive
          );

          // Extract unique students from bookings
          const uniqueStudents = Array.from(
            new Set(activeBookings.map((booking) => booking.studentId))
          ).filter(Boolean);

          setStudents(uniqueStudents);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        toast.error("Failed to load students");
      }
    };

    fetchStudents();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncement({
      ...announcement,
      [name]: value,
    });
  };

  // Handle student selection
  const handleStudentSelection = (student) => {
    const isSelected = announcement.selectedStudents.includes(student._id);
    let updatedStudents;

    if (isSelected) {
      updatedStudents = announcement.selectedStudents.filter(
        (id) => id !== student._id
      );
    } else {
      updatedStudents = [...announcement.selectedStudents, student._id];
    }

    setAnnouncement({
      ...announcement,
      selectedStudents: updatedStudents,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!announcement.title.trim()) {
      toast.error("Please enter an announcement title");
      return;
    }

    if (!announcement.content.trim()) {
      toast.error("Please enter announcement content");
      return;
    }

    if (
      announcement.targetAudience === "specific" &&
      announcement.selectedStudents.length === 0
    ) {
      toast.error("Please select at least one student");
      return;
    }

    setIsLoading(true);

    // Create announcement object
    const announcementData = {
      ...announcement,
      // If targetAudience is 'all', include all student IDs
      selectedStudents: announcement.targetAudience === "all" 
        ? students.map(student => student._id)
        : announcement.selectedStudents,
      sentAt: new Date().toISOString(),
    };

    // Emit to socket
    console.log("Emitting announcement:", announcementData);
    socket.emit("send_tutor_announcement", announcementData);

    // Show success message
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Announcement sent successfully!");

      // Reset form
      setAnnouncement({
        title: "",
        content: "",
        targetAudience: "all",
        selectedStudents: [],
      });
    }, 800);
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4.8rem)] bg-gradient-to-b from-gray-50 to-white">
      <Toaster position="top-right" richColors />

      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Send Announcement
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Create and send important announcements to keep your students informed and engaged
          </p>
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200 text-center transition-all duration-300 hover:shadow-lg">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Users className="h-14 w-14 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                No Active Students
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                You currently don&apos;t have any active students to send announcements to.
                Once you have active bookings with students, you can send them announcements here.
              </p>
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start max-w-md mx-auto">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Students will appear here once they have active bookings with you. Check your booking dashboard for more information.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-200 transition-all duration-300 hover:shadow-lg">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Announcement Title<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={announcement.title}
                    onChange={handleInputChange}
                    placeholder="Enter a clear, concise title"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    required
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label
                    htmlFor="targetAudience"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Target Audience<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <select
                      id="targetAudience"
                      name="targetAudience"
                      value={announcement.targetAudience}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none shadow-sm bg-white transition-all duration-200"
                      required
                    >
                      <option value="all">All My Students</option>
                      <option value="specific">Specific Students</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Student Selection */}
                {announcement.targetAudience === "specific" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Students<span className="text-red-500">*</span>
                    </label>
                    <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto shadow-sm">
                      <div className="sticky top-0 bg-white p-3 border-b z-10">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <div
                              key={student._id}
                              className="flex items-center p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors duration-150 mb-1 border border-transparent hover:border-blue-100"
                              onClick={() => handleStudentSelection(student)}
                            >
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 mr-3 font-medium text-sm">
                                {student.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <span className="font-medium text-gray-800">{student.username}</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={announcement.selectedStudents.includes(student._id)}
                                onChange={() => {}}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No students found matching your search
                          </div>
                        )}
                      </div>
                    </div>
                    {announcement.selectedStudents.length > 0 && (
                      <div className="mt-2 text-sm text-blue-600">
                        {announcement.selectedStudents.length} student{announcement.selectedStudents.length !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Announcement Content<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={announcement.content}
                    onChange={handleInputChange}
                    placeholder="Enter your announcement details here..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    required
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Announcements will be sent immediately to the selected students. They will receive a notification and can view it in their dashboard.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Announcement
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorAnnouncementPage;
