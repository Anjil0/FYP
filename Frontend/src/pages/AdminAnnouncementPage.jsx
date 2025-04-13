import { useState } from "react";
import { Send, Users } from "lucide-react";
import Sidebar from "../components/AdminSidebar";
import { toast, Toaster } from "sonner";
import socket from "../socket";

const AnnouncementPage = () => {
  const [selectedSection, setSelectedSection] = useState("announcements");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [announcement, setAnnouncement] = useState({
    title: "",
    content: "",
    targetAudience: "all",
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncement({
      ...announcement,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (!announcement.title.trim()) {
      toast.error("Please enter an announcement title");
      return;
    }

    if (!announcement.content.trim()) {
      toast.error("Please enter announcement content");
      return;
    }

    // Send announcement via socket
    setIsLoading(true);

    // Create announcement object to send
    const announcementData = {
      ...announcement,
      sentAt: new Date().toISOString(),
    };

    // Emit to socket
    socket.emit("send_announcement", announcementData);

    // Show success message
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Announcement sent successfully!");

      // Reset form
      setAnnouncement({
        title: "",
        content: "",
        targetAudience: "all",
      });
    }, 800);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" richColors/>

      {/* Sidebar */}
      <Sidebar
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Send Announcement
            </h1>
            <p className="text-gray-600 mt-1">
              Create and send important announcements to active users
            </p>
          </div>

          {/* Announcement Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Announcement Title*
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={announcement.title}
                    onChange={handleInputChange}
                    placeholder="Enter announcement title"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label
                    htmlFor="targetAudience"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Target Audience*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="targetAudience"
                      name="targetAudience"
                      value={announcement.targetAudience}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="all">All Users</option>
                      <option value="students">Students Only</option>
                      <option value="tutors">Tutors Only</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Announcement Content*
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={announcement.content}
                    onChange={handleInputChange}
                    placeholder="Enter announcement content..."
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPage;
