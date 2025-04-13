import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  User,
  RefreshCw,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import axios from "axios";
import baseUrl from "../config/config";
import SubmitAssignment from "./SubmitAssignment";
import { useNavigate, useLocation } from "react-router-dom";

const AssignmentsList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openAssignments, setOpenAssignments] = useState([]);
  const [closedAssignments, setClosedAssignments] = useState([]);
  const [openExpanded, setOpenExpanded] = useState(true);
  const [closedExpanded, setClosedExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const token = localStorage.getItem("accessToken");

  // State for the submit assignment modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  // Get tutor ID from URL query parameters
  const getSelectedTutorIdFromParams = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("tutorId");
  };

  // Update URL with selected tutor ID
  const updateUrlWithTutorId = (tutorId) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("tutorId", tutorId);
    navigate(
      {
        pathname: location.pathname,
        search: searchParams.toString(),
      },
      { replace: true }
    );
  };

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/api/bookings/getAllTutors`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Extract tutor data according to the actual API response structure
        const tutorsData = response.data?.Result?.tutors || [];
        if (tutorsData.length > 0) {
          // Map the tutor data to match the expected format in the component
          const formattedTutors = tutorsData.map((tutor) => ({
            _id: tutor.tutorId,
            name: tutor.tutorName,
          }));
          setTutors(formattedTutors);

          // Get tutor ID from URL params
          const tutorIdFromParams = getSelectedTutorIdFromParams();

          // If tutor ID exists in params and matches one of our tutors, select it
          if (tutorIdFromParams) {
            const matchedTutor = formattedTutors.find(
              (tutor) => tutor._id === tutorIdFromParams
            );
            if (matchedTutor) {
              setSelectedTutor(matchedTutor);
              fetchAssignments(matchedTutor._id);
              toast.success(
                `Showing assignments from Tutor ${matchedTutor.name}`
              );
              return;
            }
          }

          // Default to first tutor if no match or no param
          setSelectedTutor(formattedTutors[0]);
          // Update URL with default tutor ID
          updateUrlWithTutorId(formattedTutors[0]._id);
          toast.success("Tutors loaded successfully");
          // Fetch assignments for the default tutor
          fetchAssignments(formattedTutors[0]._id);
        } else {
          toast.warning("No tutors found");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching tutors:", error);
        toast.error(`Failed to load tutors: ${error.message}`);
        setLoading(false);
      }
    };

    fetchTutors();
  }, [token, location.search]);

  // Function to fetch assignments based on tutor ID
  const fetchAssignments = async (tutorId) => {
    setLoading(true);
    try {
      // Fetch open assignments - note the API structure based on the provided example
      const openResponse = await axios.get(
        `${baseUrl}/api/assignments/getOpenAssignments/${tutorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch closed assignments
      const closedResponse = await axios.get(
        `${baseUrl}/api/assignments/getClosedAssignments/${tutorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // The assignments are directly in Result array based on the provided example
      setOpenAssignments(openResponse.data?.Result || []);
      setClosedAssignments(closedResponse.data?.Result || []);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error(`Failed to load assignments: ${error.message}`);
      setLoading(false);
    }
  };

  const handleTutorSelect = (tutor) => {
    setSelectedTutor(tutor);
    setIsDropdownOpen(false);
    toast.info(`Showing assignments from Tutor ${tutor.name}`);

    // Update URL with selected tutor ID
    updateUrlWithTutorId(tutor._id);

    // Fetch assignments for the selected tutor
    fetchAssignments(tutor._id);
  };

  // Helper function to format date
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

  // Modified to handle the status values from the API
  const getStatusBadge = (status) => {
    switch (status) {
      case "assigned":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
            Assigned
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            Submitted
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            Completed yet to be reviewed
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
            Overdue
          </span>
        );
      case "UnSubmitted":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
            UnSubmitted
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            Submitted and Reviewed By Tutor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const handleAssignmentClick = (assignmentId) => {
    // In a real app, this would navigate to the assignment details page
    console.log(`Navigate to assignment ${assignmentId}`);
    navigate(`/stdAssignment/${assignmentId}`);
    toast.info(`Opening assignment details`, {
      description: `Assignment ID: ${assignmentId}`,
    });
  };

  // Open the submit modal with the selected assignment ID
  const handleSubmitClick = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
    setSubmitModalOpen(true);
  };

  // Handle closing the submit modal
  const handleCloseSubmitModal = () => {
    setSubmitModalOpen(false);
    setSelectedAssignmentId(null);
    // Refresh assignments when modal is closed
    if (selectedTutor) {
      fetchAssignments(selectedTutor._id);
    }
  };

  // Get the submit button text based on assignment status
  const getSubmitButtonText = (assignment) => {
    return assignment.status === "submitted" || assignment.status === "overdue"
      ? "Edit Submission"
      : "Submit Assignment";
  };

  // Get the submit button icon based on assignment status
  const getSubmitButtonIcon = (assignment) => {
    return assignment.status === "submitted" ||
      assignment.status === "overdue" ? (
      <RefreshCw size={16} className="mr-2" />
    ) : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <Toaster richColors />
      <h1 className="text-2xl font-bold mb-6">My Assignments</h1>
      <p className="text-gray-500 mb-6">
        Select a tutor from the dropdown below to view their assignments.
      </p>

      {/* Tutor Selection Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          View Assignments By Tutor
        </label>
        <div className="relative">
          <button
            type="button"
            className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="flex items-center">
              <User className="mr-2 text-gray-400" size={18} />
              <span className="block truncate">
                {selectedTutor ? selectedTutor.name : "Select a tutor"}
              </span>
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              {isDropdownOpen ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {tutors.map((tutor) => (
                <div
                  key={tutor._id}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${
                    selectedTutor && selectedTutor._id === tutor._id
                      ? "bg-indigo-100"
                      : ""
                  }`}
                  onClick={() => handleTutorSelect(tutor)}
                >
                  <div className="flex items-center">
                    <span className="font-medium block truncate">
                      {tutor.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display selected tutor info */}
      {selectedTutor && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-md">
          <h2 className="text-lg font-medium text-indigo-800">
            Viewing assignments from Tutor {selectedTutor.name}
          </h2>
        </div>
      )}

      {/* Open Assignments Section */}
      <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
        <button
          className="w-full flex justify-between items-center p-4 bg-gray-50 text-left"
          onClick={() => setOpenExpanded(!openExpanded)}
        >
          <h2 className="text-lg font-medium text-gray-800">
            Open Assignments ({openAssignments.length})
          </h2>
          {openExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {openExpanded && (
          <div className="divide-y divide-gray-200">
            {openAssignments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No open assignments found
              </div>
            ) : (
              openAssignments.map((assignment) => (
                <div key={assignment._id} className="p-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAssignmentClick(assignment._id);
                      }}
                      className="text-lg font-medium text-indigo-700 hover:text-indigo-900 transition"
                    >
                      {assignment.title}
                    </a>
                    <span className="mt-2 md:mt-0 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-md">
                      {assignment.subject}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center text-sm text-gray-600 mb-3">
                    <div className="flex items-center mr-4 mb-2">
                      <FileText size={16} className="mr-1" />
                      <span>Created: {formatDate(assignment.createdAt)}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <Clock size={16} className="mr-1" />
                      <span>Due: {formatDate(assignment.dueDate)}</span>
                    </div>
                  </div>

                  {/* Display assignment description preview */}
                  {assignment.description && (
                    <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {assignment.description}
                    </div>
                  )}

                  {/* Display attachment info if available */}
                  {assignment.attachments &&
                    assignment.attachments.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          {assignment.attachments.length} attachment
                          {assignment.attachments.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(assignment.status)}
                      {assignment.feedback && assignment.feedback.comment && (
                        <span className="text-sm text-gray-600">
                          Feedback available
                        </span>
                      )}
                    </div>

                    <div className="mt-3 md:mt-0 flex space-x-2">
                      <button
                        onClick={() => handleSubmitClick(assignment._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                      >
                        {getSubmitButtonIcon(assignment)}
                        {getSubmitButtonText(assignment)}
                      </button>
                      <button
                        onClick={() => handleAssignmentClick(assignment._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Full Report
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Closed Assignments Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          className="w-full flex justify-between items-center p-4 bg-gray-50 text-left"
          onClick={() => setClosedExpanded(!closedExpanded)}
        >
          <h2 className="text-lg font-medium text-gray-800">
            Closed Assignments ({closedAssignments.length})
          </h2>
          {closedExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {closedExpanded && (
          <div className="divide-y divide-gray-200">
            {closedAssignments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No closed assignments found
              </div>
            ) : (
              closedAssignments.map((assignment) => (
                <div key={assignment._id} className="p-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAssignmentClick(assignment._id);
                      }}
                      className="text-lg font-medium text-gray-700 hover:text-gray-900 transition"
                    >
                      {assignment.title}
                    </a>
                    <span className="mt-2 md:mt-0 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-md">
                      {assignment.subject}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center text-sm text-gray-600 mb-3">
                    <div className="flex items-center mr-4 mb-2">
                      <FileText size={16} className="mr-1" />
                      <span>Created: {formatDate(assignment.createdAt)}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <Clock size={16} className="mr-1" />
                      <span>Due: {formatDate(assignment.dueDate)}</span>
                    </div>
                  </div>

                  {/* Display assignment description preview */}
                  {assignment.description && (
                    <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {assignment.description}
                    </div>
                  )}

                  {/* Display attachment info if available */}
                  {assignment.attachments &&
                    assignment.attachments.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          {assignment.attachments.length} attachment
                          {assignment.attachments.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(assignment.status)}
                      {assignment.feedback && assignment.feedback.comment && (
                        <span className="text-sm text-gray-600 ml-2">
                          Feedback available
                        </span>
                      )}
                    </div>

                    <div className="mt-3 md:mt-0">
                      <button
                        onClick={() => handleAssignmentClick(assignment._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {submitModalOpen && (
        <SubmitAssignment
          assignmentId={selectedAssignmentId}
          onClose={handleCloseSubmitModal}
        />
      )}
    </div>
  );
};

export default AssignmentsList;
