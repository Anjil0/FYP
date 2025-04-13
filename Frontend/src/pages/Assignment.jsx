import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle,
  Search,
  ChevronRight,
  AlertCircle,
  Filter,
  Paperclip,
  Calendar,
  User,
  BookText,
} from "lucide-react";
import baseUrl from "../config/config";

const AssignmentsDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assigned");
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("accessToken");
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/assignments/getTutorAssignments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setAssignments(response.data.Result || []);
        setFilteredAssignments(
          filterAssignmentsByStatus(response.data.Result || [], activeTab)
        );
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setError("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [activeTab, token]);

  const filterAssignmentsByStatus = (assignments, status) => {
    return assignments.filter((assignment) => assignment.status === status);
  };

  const handleTabChange = (status) => {
    setActiveTab(status);
    setFilteredAssignments(filterAssignmentsByStatus(assignments, status));
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredAssignments(filterAssignmentsByStatus(assignments, activeTab));
    } else {
      const filtered = filterAssignmentsByStatus(assignments, activeTab).filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(query) ||
          assignment.studentId?.username?.toLowerCase().includes(query)
      );
      setFilteredAssignments(filtered);
    }
  };

  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (dueDate, assignment) => {
    if (assignment.status === "completed" || assignment.status === "reviewed") {
      return {
        text: `Submitted`,
        class: "text-indigo-600 font-medium",
      };
    }
    if (assignment.status === "unsubmitted") {
      return {
        text: `Times Up Unsubmitted`,
        class: "text-red-600 font-medium",
      };
    }
    console.log(dueDate);

    return {
      text: `(Due on ${formatDate(dueDate)})`,
      class: "text-red-600 font-medium",
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    return date
      .toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " at");
  };

  const navigateToCreate = () => {
    navigate("/assignments/create");
  };

  const navigateToAssignmentDetails = (assignmentId) => {
    navigate(`/assignments/${assignmentId}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 h-[calc(100vh-4.8rem)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
          <BookText className="h-8 w-8 mr-2 text-indigo-600" />
          Assignments
        </h1>
        <button
          onClick={navigateToCreate}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md"
        >
          <Plus className="h-5 w-5 mr-1" />
          <span>Create Assignment</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start rounded-r-md shadow-sm">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex">
            <button
              className={`py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === "assigned"
                  ? "border-b-2 border-indigo-500 text-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("assigned")}
            >
              Assigned
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === "submitted"
                  ? "border-b-2 border-indigo-500 text-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("submitted")}
            >
              Submitted
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === "completed"
                  ? "border-b-2 border-indigo-500 text-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("completed")}
            >
              Completed
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === "reviewed"
                  ? "border-b-2 border-indigo-500 text-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("reviewed")}
            >
              Reviewed
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === "unsubmitted"
                  ? "border-b-2 border-indigo-500 text-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("unsubmitted")}
            >
              Not Submitted
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select className="form-select rounded-md border-gray-300 py-2 pl-3 pr-8 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option>All Students</option>
                <option>Due Date (Closest)</option>
                <option>Due Date (Furthest)</option>
                <option>Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignment List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center p-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No assignments found
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === "assigned"
                  ? "You haven't assigned any assignments yet."
                  : "No assignments have been completed yet."}
              </p>
              {activeTab === "assigned" && (
                <button
                  onClick={navigateToCreate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Assignment
                </button>
              )}
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment._id}
                className="p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigateToAssignmentDetails(assignment._id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-grow mb-4 md:mb-0">
                    <div className="flex items-start">
                      <div
                        className={`rounded-full p-2 ${
                          activeTab === "assigned"
                            ? "bg-indigo-100"
                            : "bg-green-100"
                        } mr-4 shadow-sm`}
                      >
                        {activeTab === "assigned" ? (
                          <Clock
                            className={`h-5 w-5 ${
                              activeTab === "assigned"
                                ? "text-indigo-600"
                                : "text-green-600"
                            }`}
                          />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {assignment.title}
                        </h3>
                        <div className="flex flex-wrap gap-y-2 gap-x-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDueDate(assignment.dueDate)}
                          </div>
                          <div className="flex items-center text-sm">
                            {assignment.status === "completed" ||
                            assignment.status === "reviewed" ||
                            assignment.status === "unsubmitted" ? (
                              <div>
                                {" "}
                                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                              </div>
                            ) : (
                              <div>
                                {" "}
                                <Clock className="h-4 w-4 mr-1" />
                              </div>
                            )}

                            <span
                              className={
                                getDaysRemaining(assignment.dueDate, assignment)
                                  .class
                              }
                            >
                              {
                                getDaysRemaining(assignment.dueDate, assignment)
                                  .text
                              }
                            </span>
                          </div>
                        </div>
                        {assignment.studentId && (
                          <p className="text-sm text-gray-600 mt-2 flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="font-medium">
                              {assignment.studentId.username}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="hidden md:block">
                      {assignment.attachments &&
                        assignment.attachments.length > 0 && (
                          <div className="flex items-center mr-6 text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-md">
                            <Paperclip className="h-4 w-4 mr-1" />
                            {assignment.attachments.length}{" "}
                            {assignment.attachments.length === 1
                              ? "attachment"
                              : "attachments"}
                          </div>
                        )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination (if needed) */}
      {filteredAssignments.length > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">
                  {filteredAssignments.length}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredAssignments.length}
                </span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <a
                  href="#"
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </a>
                <a
                  href="#"
                  aria-current="page"
                  className="relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  1
                </a>
                <a
                  href="#"
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </a>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {filteredAssignments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-blue-100 mr-3">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-semibold">
                  {
                    assignments.filter(
                      (a) => a.status === "assigned" || a.status === "submitted"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-green-100 mr-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-xl font-semibold">
                  {assignments.filter((a) => a.status === "completed").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-green-100 mr-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Reviewed</p>
                <p className="text-xl font-semibold">
                  {assignments.filter((a) => a.status === "reviewed").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-green-100 mr-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Not Submitted</p>
                <p className="text-xl font-semibold">
                  {assignments.filter((a) => a.status === "unsubmitted").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-purple-100 mr-3">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-semibold">{assignments.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsDashboard;
