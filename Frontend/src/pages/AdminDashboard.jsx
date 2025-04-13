// AdminDashboard.js
import { useState, useEffect } from "react";
import {
  Users,
  Book,
  DollarSign,
  Bell,
  Search,
  ChevronUp,
  ChevronDown,
  Shield,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Star,
  Clock,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import Sidebar from "../components/AdminSidebar";
import axios from "axios";
import baseUrl from "../config/config";

const AdminDashboard = () => {
  const [selectedSection, setSelectedSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      activeTutors: 0,
      monthlyRevenue: 0,
      pendingVerifications: 0,
    },
    revenueData: [],
    userGrowthData: [],
    bookingStatusData: [],
    genderDistribution: [],
    teachingModeData: [],
    recentActivities: [],
    recentUsers: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/users/getAdminDashboard`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
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

        {/* Dashboard Content */}
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    title: "Total Users",
                    value: dashboardData.stats.totalUsers.toLocaleString(),
                    change: dashboardData.stats.userGrowthRate + "%",
                    icon: <Users className="h-6 w-6 text-white" />,
                    positive: dashboardData.stats.userGrowthRate >= 0,
                    color: "bg-gradient-to-r from-blue-500 to-blue-600",
                    iconBg: "bg-blue-600",
                  },
                  {
                    title: "Active Tutors",
                    value: dashboardData.stats.activeTutors.toLocaleString(),
                    change: dashboardData.stats.tutorGrowthRate + "%",
                    icon: <Book className="h-6 w-6 text-white" />,
                    positive: dashboardData.stats.tutorGrowthRate >= 0,
                    color: "bg-gradient-to-r from-green-500 to-green-600",
                    iconBg: "bg-green-600",
                  },
                  {
                    title: "Monthly Revenue",
                    value:
                      "NPR " +
                      dashboardData.stats.monthlyRevenue.toLocaleString(),
                    change: dashboardData.stats.revenueGrowthRate + "%",
                    icon: <DollarSign className="h-6 w-6 text-white" />,
                    positive: dashboardData.stats.revenueGrowthRate >= 0,
                    color: "bg-gradient-to-r from-purple-500 to-purple-600",
                    iconBg: "bg-purple-600",
                  },
                  {
                    title: "Pending Verifications",
                    value:
                      dashboardData.stats.pendingVerifications.toLocaleString(),
                    change: dashboardData.stats.verificationChangeRate + "%",
                    icon: <Shield className="h-6 w-6 text-white" />,
                    positive: dashboardData.stats.verificationChangeRate < 0,
                    color: "bg-gradient-to-r from-orange-500 to-orange-600",
                    iconBg: "bg-orange-600",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`${stat.color} rounded-xl shadow-lg p-6 text-white`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.iconBg} p-3 rounded-lg`}>
                        {stat.icon}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm 
                        ${stat.positive ? "text-green-200" : "text-red-200"}`}
                      >
                        {stat.change}
                        {stat.positive ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-white text-opacity-80">
                      {stat.title}
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue and User Growth Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold flex items-center">
                        <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
                        Revenue Overview
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Monthly revenue in NPR
                      </p>
                    </div>
                    <select className="bg-gray-100 border-0 rounded-lg p-2 text-sm">
                      <option>Last 6 Months</option>
                      <option>Last Year</option>
                      <option>All Time</option>
                    </select>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData.revenueData}>
                        <defs>
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8884d8"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8884d8"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `NPR ${value.toLocaleString()}`,
                            "Revenue",
                          ]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#8884d8"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* User Growth Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold flex items-center">
                        <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                        User Growth
                      </h2>
                      <p className="text-gray-500 text-sm">
                        New registrations per month
                      </p>
                    </div>
                    <select className="bg-gray-100 border-0 rounded-lg p-2 text-sm">
                      <option>Last 6 Months</option>
                      <option>Last Year</option>
                      <option>All Time</option>
                    </select>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === "tutors" ? "Tutors" : "Students",
                          ]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Legend />
                        <Bar
                          dataKey="students"
                          fill="#0088FE"
                          name="Students"
                        />
                        <Bar dataKey="tutors" fill="#00C49F" name="Tutors" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Additional Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Booking Status */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold flex items-center">
                        <Calendar className="h-5 w-5 text-green-500 mr-2" />
                        Booking Status
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Current distribution
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.bookingStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {dashboardData.bookingStatusData.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Bookings"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {dashboardData.bookingStatusData.map((entry, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span className="text-xs text-gray-600">
                          {entry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gender Distribution */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold flex items-center">
                        <Users className="h-5 w-5 text-blue-500 mr-2" />
                        Tutor Gender Distribution
                      </h2>
                      <p className="text-gray-500 text-sm">Demographics</p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.genderDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="gender"
                          label
                        >
                          {dashboardData.genderDistribution.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-2">
                    {dashboardData.genderDistribution.map((entry, index) => (
                      <div key={index} className="flex items-center mx-2">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span className="text-xs text-gray-600">
                          {entry.gender}: {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teaching Mode */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold flex items-center">
                        <Book className="h-5 w-5 text-orange-500 mr-2" />
                        Teaching Mode
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Online vs Physical
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={dashboardData.teachingModeData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 70,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis type="number" />
                        <YAxis dataKey="type" type="category" />
                        <Tooltip />
                        <Bar dataKey="tutors" name="Tutors" fill="#8884d8" />
                        <Bar
                          dataKey="bookings"
                          name="Bookings"
                          fill="#82ca9d"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activities and Users */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Activities */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold flex items-center">
                        <Clock className="h-5 w-5 text-blue-500 mr-2" />
                        Recent Activities
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Latest system events
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {dashboardData.recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border-l-4 transition-all"
                        style={{
                          borderLeftColor:
                            activity.type === "payment"
                              ? "#8884d8"
                              : activity.type === "registration"
                              ? "#82ca9d"
                              : activity.type === "booking"
                              ? "#ffc658"
                              : "#ff7300",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-full"
                            style={{
                              backgroundColor:
                                activity.type === "payment"
                                  ? "rgba(136, 132, 216, 0.1)"
                                  : activity.type === "registration"
                                  ? "rgba(130, 202, 157, 0.1)"
                                  : activity.type === "booking"
                                  ? "rgba(255, 198, 88, 0.1)"
                                  : "rgba(255, 115, 0, 0.1)",
                            }}
                          >
                            {activity.type === "payment" && (
                              <Wallet
                                className="h-5 w-5"
                                style={{ color: "#8884d8" }}
                              />
                            )}
                            {activity.type === "registration" && (
                              <Users
                                className="h-5 w-5"
                                style={{ color: "#82ca9d" }}
                              />
                            )}
                            {activity.type === "booking" && (
                              <Calendar
                                className="h-5 w-5"
                                style={{ color: "#ffc658" }}
                              />
                            )}
                            {activity.type === "support" && (
                              <Bell
                                className="h-5 w-5"
                                style={{ color: "#ff7300" }}
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{activity.action}</div>
                            <div className="text-sm text-gray-500">
                              {activity.detail}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {activity.time}
                          </div>
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${
                              activity.status === "completed"
                                ? "bg-green-100 text-green-600"
                                : activity.status === "pending"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {activity.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold flex items-center">
                        <Users className="h-5 w-5 text-green-500 mr-2" />
                        Recent Users
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Newly registered users
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {dashboardData.recentUsers.map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-all"
                      >
                        <img
                          src={user.image || "/api/placeholder/40/40"}
                          alt={user.name}
                          className="w-10 h-10 rounded-full mr-3 object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">
                              {user.joined}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs
                              ${
                                user.role === "tutor"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-green-100 text-green-600"
                              }`}
                            >
                              {user.role === "tutor" ? "Tutor" : "Student"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white rounded-xl shadow-lg mt-6 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 mr-2" />
                      Recent Bookings
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Latest tutoring bookings
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-4">Student</th>
                        <th className="text-left py-4 px-4">Tutor</th>
                        <th className="text-left py-4 px-4">Date</th>
                        <th className="text-left py-4 px-4">Amount</th>
                        <th className="text-left py-4 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentBookings &&
                        dashboardData.recentBookings.map((booking, index) => (
                          <tr
                            key={index}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    booking.studentImage ||
                                    "/api/placeholder/32/32"
                                  }
                                  alt={booking.studentName}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <div className="font-medium">
                                    {booking.studentName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {booking.studentEmail}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    booking.tutorImage ||
                                    "/api/placeholder/32/32"
                                  }
                                  alt={booking.tutorName}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="font-medium">
                                  {booking.tutorName}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>{booking.date}</div>
                              <div className="text-xs text-gray-500">
                                {booking.time}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-medium">
                                NPR {booking.amount}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs
                              ${
                                booking.status === "completed"
                                  ? "bg-green-100 text-green-600"
                                  : booking.status === "ongoing"
                                  ? "bg-blue-100 text-blue-600"
                                  : booking.status === "pending"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : booking.status === "rated"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                              >
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
