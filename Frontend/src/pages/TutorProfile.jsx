import { useState } from "react";
import {
  Award,
  Book,
  Clock,
  Star,
  Trophy,
  Users,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Globe,
  Edit,
} from "lucide-react";

const TutorProfile = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    {
      icon: <Users className="h-6 w-6" />,
      value: "120+",
      label: "Students Taught",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      value: "500+",
      label: "Hours Completed",
    },
    { icon: <Star className="h-6 w-6" />, value: "4.9", label: "Rating" },
    {
      icon: <Trophy className="h-6 w-6" />,
      value: "15",
      label: "Achievements",
    },
  ];

  const achievements = [
    {
      title: "Quick Responder",
      description: "Responds within 1 hour",
      icon: <Clock className="h-6 w-6" />,
    },
    {
      title: "Top Rated",
      description: "Maintained 4.9+ rating",
      icon: <Star className="h-6 w-6" />,
    },
    {
      title: "Expert Status",
      description: "Verified expertise",
      icon: <Award className="h-6 w-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Profile Info */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Edit Button */}
            <button className="absolute top-0 right-0 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-8">
              <div className="relative">
                <img
                  src="/api/placeholder/150/150"
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white" />
              </div>

              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">Sarah Johnson</h1>
                <div className="flex items-center gap-4 text-white/90">
                  <span className="flex items-center gap-1">
                    <Book className="h-4 w-4" />
                    Mathematics Expert
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Kathmandu, Nepal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex gap-4 border-b">
                {["overview", "reviews", "schedule", "achievements"].map(
                  (tab) => (
                    <button
                      key={tab}
                      className={`pb-4 px-4 text-sm font-medium ${
                        activeTab === tab
                          ? "border-b-2 border-blue-600 text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  )
                )}
              </div>

              {/* Tab Content */}
              <div className="pt-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">About Me</h3>
                      <p className="text-gray-600">
                        Dedicated mathematics tutor with over 5 years of
                        experience teaching students from grade 8 to
                        undergraduate level. Specialized in making complex
                        concepts easy to understand through practical examples
                        and interactive learning methods.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Calculus",
                          "Algebra",
                          "Geometry",
                          "Statistics",
                          "Physics",
                        ].map((skill) => (
                          <span
                            key={skill}
                            className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Teaching Approach
                      </h3>
                      <ul className="space-y-2">
                        {[
                          "Interactive problem-solving sessions",
                          "Custom study materials and resources",
                          "Regular progress assessments",
                          "Flexible learning pace",
                        ].map((item, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-gray-600"
                          >
                            <ChevronRight className="h-4 w-4 text-blue-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  {
                    action: "Completed session with",
                    student: "Raj Sharma",
                    time: "2 hours ago",
                  },
                  {
                    action: "Scheduled new session with",
                    student: "Priya Patel",
                    time: "5 hours ago",
                  },
                  {
                    action: "Received a 5-star rating from",
                    student: "Amit Kumar",
                    time: "1 day ago",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600">
                        <span className="text-gray-900">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.student}</span>
                      </p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Contact Information
              </h3>
              <div className="space-y-4">
                {[
                  {
                    icon: <Mail className="h-5 w-5" />,
                    label: "Email",
                    value: "sarah.j@tutorease.com",
                  },
                  {
                    icon: <Phone className="h-5 w-5" />,
                    label: "Phone",
                    value: "+977 98XXXXXXXX",
                  },
                  {
                    icon: <Globe className="h-5 w-5" />,
                    label: "Website",
                    value: "tutorease.com/sarah",
                  },
                ].map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-gray-600"
                  >
                    <div className="text-blue-600">{contact.icon}</div>
                    <div>
                      <div className="text-sm text-gray-500">
                        {contact.label}
                      </div>
                      <div>{contact.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Calendar */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Availability</h3>
                <button className="text-blue-600 text-sm hover:underline">
                  View Full Schedule
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { day: "Monday", time: "9:00 AM - 5:00 PM" },
                  { day: "Tuesday", time: "9:00 AM - 5:00 PM" },
                  { day: "Wednesday", time: "1:00 PM - 7:00 PM" },
                  { day: "Thursday", time: "9:00 AM - 5:00 PM" },
                  { day: "Friday", time: "9:00 AM - 3:00 PM" },
                ].map((schedule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">{schedule.day}</span>
                    <span className="text-gray-900 font-medium">
                      {schedule.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Achievements</h3>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="text-blue-600">{achievement.icon}</div>
                    <div>
                      <div className="font-medium">{achievement.title}</div>
                      <div className="text-sm text-gray-600">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;
