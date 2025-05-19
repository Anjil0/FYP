"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  UserCog,
  GraduationCap,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
} from "lucide-react";
import baseUrl from "/src/config/config";
import { useLoading } from "./../config/LoadingContext";
import { toast, Toaster } from "sonner";
import Sidebar from "./../components/AdminSidebar";

const UserManagement = () => {
  const { setLoading } = useLoading();

  // Data state
  const [allUsers, setAllUsers] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [selectedSection, setSelectedSection] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTutors: 0,
    totalAdmins: 0,
  });

  // Pagination state (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all users on component mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Update displayed users when filtered users, page, or page size changes
  useEffect(() => {
    updateDisplayedUsers();
  }, [filteredUsers, currentPage, pageSize]);

  // Update filtered users when section or search term changes
  useEffect(() => {
    filterUsers(selectedSection, searchTerm);
  }, [allUsers, allTutors, selectedSection, searchTerm]);

  // Calculate total pages when filtered users or page size changes
  useEffect(() => {
    const total = Math.ceil(filteredUsers.length / pageSize);
    setTotalPages(total || 1);

    // Reset to first page if current page is out of bounds
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredUsers, pageSize]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${baseUrl}/api/tutors/getAllUsers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("API Response:", response.data);

      if (response.data.IsSuccess && response.data.Result.data) {
        const { users, tutors } = response.data.Result.data;
        const totalCounts = response.data.Result.totalCount || {};

        setAllUsers(users || []);
        setAllTutors(tutors || []);

        // Set stats from the response or calculate if not provided
        setStats({
          totalUsers:
            totalCounts.totalUsers ||
            (users?.length || 0) + (tutors?.length || 0),
          totalStudents:
            totalCounts.totalStudents ||
            users?.filter((user) => user.role === "user").length ||
            0,
          totalTutors: totalCounts.totalTutors || tutors?.length || 0,
          totalAdmins:
            totalCounts.totalAdmins ||
            users?.filter((user) => user.role === "admin").length ||
            0,
        });
      } else {
        console.error("No user data found in the response.");
        setAllUsers([]);
        setAllTutors([]);
        setError("Failed to load user data. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      handleErrors(error);
      setAllUsers([]);
      setAllTutors([]);
      setError("An error occurred while fetching users. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const updateDisplayedUsers = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setDisplayedUsers(filteredUsers.slice(startIndex, endIndex));
  };

  const filterUsers = (section, term) => {
    let filtered = [];

    // Filter by section
    if (section === "All") {
      filtered = [...allUsers, ...allTutors];
    } else if (section === "Tutor") {
      filtered = allTutors;
    } else if (section === "Student") {
      filtered = allUsers.filter((user) => user.role === "user");
    } else {
      filtered = allUsers.filter((user) => user.role === "admin");
    }

    // Filter by search term
    if (term) {
      filtered = filtered.filter(
        (user) =>
          user.username?.toLowerCase().includes(term.toLowerCase()) ||
          user.email?.toLowerCase().includes(term.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number.parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleTabChange = (tab) => {
    setSelectedSection(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleErrors = (error) => {
    console.error("Error:", error);
    if (error.response && error.response.data) {
      if (Array.isArray(error.response.data.ErrorMessage)) {
        const errorMessages = error.response.data.ErrorMessage.map(
          (err) => err.message || err
        ).join(", ");
        toast.error(`${errorMessages}`);
      } else if (typeof error.response.data.ErrorMessage === "string") {
        toast.error(error.response.data.ErrorMessage);
      } else {
        toast.error("An error occurred while fetching users");
      }
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const getRoleDisplayName = (role) => {
    if (!role) return "Unknown";
    return role.toLowerCase() === "user"
      ? "Student"
      : capitalizeFirstLetter(role);
  };

  const getRoleColor = (role) => {
    if (!role) return "bg-gray-100 text-gray-800";

    switch (role.toLowerCase()) {
      case "user":
        return "bg-emerald-100 text-emerald-800";
      case "tutor":
        return "bg-blue-100 text-blue-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role) => {
    if (!role) return <Users className="w-4 h-4" />;

    switch (role.toLowerCase()) {
      case "user":
        return <GraduationCap className="w-4 h-4" />;
      case "tutor":
        return <UserCog className="w-4 h-4" />;
      case "admin":
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  };

  const getRandomColor = (id) => {
    if (!id) return "bg-gray-500";

    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-violet-500",
      "bg-cyan-500",
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= 1) {
      return [1];
    }

    // Always show first page
    pageNumbers.push(1);

    // Calculate range of pages to show
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push("...");
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push("...");
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Sidebar
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      />

      {/* Main Content */}
      <div className="p-6 md:p-8 overflow-auto flex-1 ">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage all users in the system
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button
              onClick={fetchAllUsers}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Tutors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalTutors}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                <UserCog className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalAdmins}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {["All", "Student", "Tutor", "Admin"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      selectedSection === tab
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => handleTabChange(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading users</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchAllUsers}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {displayedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700">
                No Users Found
              </h3>
              <p className="text-gray-500 mt-2 max-w-md">
                {searchTerm
                  ? `No users match your search for "${searchTerm}". Try a different search term.`
                  : "There are no users available in this category at the moment."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                        User
                      </th>
                      <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                        Contact
                      </th>
                      <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                        Role
                      </th>
                      <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <img
                                src={user.image || "/placeholder.svg"}
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getRandomColor(
                                  user._id
                                )}`}
                              >
                                {getInitials(user.username)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.username}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.grade || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-gray-700">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              {user.phoneNumber || "No phone"}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {getRoleIcon(user.role)}
                            <span>{getRoleDisplayName(user.role)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-700">
                              {user.address || "No address"}
                            </p>
                            {user.role === "tutor" && (
                              <div className="mt-1 flex items-center gap-2">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${
                                    user.isAvailable
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                ></span>
                                <span className="text-xs text-gray-500">
                                  {user.isAvailable
                                    ? "Available"
                                    : "Unavailable"}
                                </span>
                              </div>
                            )}
                            {user.role === "user" &&
                              user.preferredSubjects &&
                              user.preferredSubjects.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {user.preferredSubjects
                                    .slice(0, 2)
                                    .map((subject, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                                      >
                                        {subject}
                                      </span>
                                    ))}
                                  {user.preferredSubjects.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{user.preferredSubjects.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100">
                <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                  Showing {displayedUsers.length} of {filteredUsers.length}{" "}
                  users (Page {currentPage} of {totalPages})
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm text-gray-500">
                      Per page:
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="First page"
                    >
                      <ChevronsLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center mx-1">
                      {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 py-1 text-gray-500"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={`page-${page}`}
                            onClick={() => handlePageChange(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md mx-0.5 ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>

                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Last page"
                    >
                      <ChevronsRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
