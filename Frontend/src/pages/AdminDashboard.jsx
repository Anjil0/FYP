// AdminDashboard.js
import { useState } from "react";
import {
  Users,
  Book,
  DollarSign,
  Bell,
  Search,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Shield,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Sidebar from "../components/AdminSidebar";

const AdminDashboard = () => {
  const [selectedSection, setSelectedSection] = useState("dashboard");

  const revenueData = [
    { month: "Jan", value: 12000 },
    { month: "Feb", value: 19000 },
    { month: "Mar", value: 25000 },
    { month: "Apr", value: 32000 },
    { month: "May", value: 40000 },
    { month: "Jun", value: 45000 },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 relative">
                <Bell className="h-6 w-6 text-gray-600" />
                <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2">
                <img
                  src="/api/placeholder/32/32"
                  alt="Admin"
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">Admin</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              {
                title: "Total Users",
                value: "12,345",
                change: "+12%",
                icon: <Users className="h-6 w-6 text-blue-600" />,
                positive: true,
              },
              {
                title: "Active Tutors",
                value: "1,234",
                change: "+8%",
                icon: <Book className="h-6 w-6 text-green-600" />,
                positive: true,
              },
              {
                title: "Monthly Revenue",
                value: "NPR 450,000",
                change: "+15%",
                icon: <DollarSign className="h-6 w-6 text-purple-600" />,
                positive: true,
              },
              {
                title: "Pending Verifications",
                value: "45",
                change: "-5%",
                icon: <Shield className="h-6 w-6 text-orange-600" />,
                positive: false,
              },
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gray-100 p-3 rounded-lg">{stat.icon}</div>
                  <div
                    className={`flex items-center gap-1 text-sm 
                    ${stat.positive ? "text-green-600" : "text-red-600"}`}
                  >
                    {stat.change}
                    {stat.positive ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.title}</div>
              </div>
            ))}
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Revenue Overview</h2>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Recent Activities</h2>
                <button className="text-blue-600 text-sm">View All</button>
              </div>
              <div className="space-y-4">
                {[
                  {
                    action: "New Tutor Registration",
                    name: "Raj Kumar",
                    time: "2 minutes ago",
                    status: "pending",
                  },
                  {
                    action: "Payment Received",
                    name: "NPR 2,500",
                    time: "15 minutes ago",
                    status: "completed",
                  },
                  {
                    action: "New Student Registration",
                    name: "Priya Shah",
                    time: "1 hour ago",
                    status: "completed",
                  },
                  {
                    action: "Support Ticket",
                    name: "#1234",
                    time: "2 hours ago",
                    status: "pending",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-sm text-gray-500">
                        {activity.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {activity.time}
                      </div>
                      <div
                        className={`text-sm ${
                          activity.status === "completed"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {activity.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Users Table */}
          <div className="bg-white rounded-xl shadow-sm mt-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Recent Users</h2>
              <button className="text-blue-600 text-sm">View All Users</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Name</th>
                    <th className="text-left py-4 px-4">Role</th>
                    <th className="text-left py-4 px-4">Status</th>
                    <th className="text-left py-4 px-4">Joined</th>
                    <th className="text-left py-4 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Aarav Patel",
                      role: "Tutor",
                      status: "Active",
                      joined: "Jan 15, 2025",
                    },
                    {
                      name: "Zara Shah",
                      role: "Student",
                      status: "Active",
                      joined: "Jan 14, 2025",
                    },
                    {
                      name: "Dev Kumar",
                      role: "Tutor",
                      status: "Pending",
                      joined: "Jan 14, 2025",
                    },
                  ].map((user, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src="/api/placeholder/32/32"
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          {user.name}
                        </div>
                      </td>
                      <td className="py-4 px-4">{user.role}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-sm
                          ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">{user.joined}</td>
                      <td className="py-4 px-4">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
