import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Calendar, Clock, FileText, Download } from "lucide-react";
import axios from "axios";
import baseUrl from "../config/config";
import SubmitAssignment from "./SubmitAssignment";

const StdSpecificAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${baseUrl}/api/assignments/getSpecificAssignment/${assignmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Ensure response has expected structure
        if (response?.data?.IsSuccess && response.data.Result) {
          const assignmentData = response.data.Result;

          if (typeof assignmentData === "object") {
            setAssignment(assignmentData);
          } else {
            setError("Invalid response format.");
          }
        } else {
          setError(
            response?.data?.ErrorMessage?.[0] ||
              "Assignment not found or access denied"
          );
        }
      } catch (error) {
        console.error("❌ Error fetching assignment details:", error);

        // Check if the error response has useful details
        if (error.response?.data?.ErrorMessage) {
          setError(error.response.data.ErrorMessage);
        } else {
          setError(
            "Failed to load assignment details. Please try again later."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId && token) {
      fetchAssignmentDetails();
    }
  }, [assignmentId, token]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Function to format the date in a shorter format (March 19, 2025 at 08:27 AM)
  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "unsubmitted":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to open file in a new tab
  const openFile = (url) => {
    window.open(url, "_blank");
  };

  // Function to get icon based on file type
  const getFileIcon = (fileType) => {
    if (
      fileType === "image" ||
      fileType === "jpg" ||
      fileType === "png" ||
      fileType === "jpeg"
    ) {
      return (
        <img
          src="https://img.icons8.com/?size=100&id=bjHuxcHTNosO&format=png&color=000000"
          alt="img"
          className="w-5 h-5 mr-2"
        />
      );
    }
    return <FileText className="w-5 h-5 mr-2 text-gray-500" />;
  };

  // Function to determine if submit button should be shown
  const shouldShowSubmitButton = (status) => {
    // Don't show button for these statuses
    return !["completed", "reviewed", "unsubmitted"].includes(status);
  };

  // Function to get submit button text based on status
  const getSubmitButtonText = (status) => {
    return status === "submitted" ? "Resubmit Assignment" : "Submit Assignment";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4 text-xl">{error}</div>
        <button
          onClick={() => navigate("/stdAssignments")}
          className="flex items-center text-purple-600 hover:underline"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Assignment List
        </button>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Assignment not found</div>
      </div>
    );
  }

  // Subject is a placeholder - you'll need to replace this with the actual subject from your data
  const subject = assignment.subject || "Mathematics";

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => navigate("/stdAssignments")}
        className="flex items-center text-purple-600 hover:underline mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Assignment List
      </button>

      {/* Assignment Header with Subject */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-2">
          <span className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-md font-medium mb-2">
            {subject}
          </span>
          <h1 className="text-2xl font-semibold text-gray-800">
            {assignment.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-gray-600 mt-4 border-t pt-4">
          <span className="inline-flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Created: {formatShortDate(assignment.createdAt)}
          </span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="inline-flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Due: {formatShortDate(assignment.dueDate)}
          </span>
        </div>
      </div>

      {/* Assignment Description */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">
          Assignment Details
        </h3>
        <div className="mb-4">
          <p className="text-gray-700 mb-4">
            Please submit your <strong>{assignment.title}</strong> with the
            necessary documents in time, if not done will be counted as
            non-submission.
          </p>

          <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
            <p className="text-gray-600">
              No submissions accepted after the deadline.
            </p>
          </div>

          {assignment.description && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Description:</h4>
              <p className="text-gray-700">{assignment.description}</p>
            </div>
          )}
        </div>

        {/* Assignment Files */}
        {assignment.attachments && assignment.attachments.length > 0 && (
          <ul className="space-y-2">
            {assignment.attachments.map((file, index) => (
              <li key={index} className="border border-gray-100 rounded-md">
                <button
                  onClick={() => openFile(file.fileUrl)}
                  className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 rounded-md transition"
                >
                  {getFileIcon(file.fileType)}
                  <span className="text-blue-600 hover:underline flex-1">
                    {file.fileName}
                  </span>
                  <Download className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Student's Submission */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-800">Your Submission</h3>
          {shouldShowSubmitButton(assignment.status) && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {getSubmitButtonText(assignment.status)}
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600 font-medium">Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${getStatusClass(
                  assignment.status
                )}`}
              >
                {assignment.status
                  ? assignment.status.charAt(0).toUpperCase() +
                    assignment.status.slice(1)
                  : "Pending"}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600 font-medium">Submissions</span>
              <span className="text-gray-700">
                {assignment.submission &&
                assignment.submission.attachments &&
                assignment.submission.attachments.length > 0
                  ? `${assignment.submission.attachments.length} file(s)`
                  : "n/a"}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600 font-medium">Submission Date</span>
              <span className="text-gray-700">
                {assignment.submission && assignment.submission.submittedAt
                  ? formatDate(assignment.submission.submittedAt)
                  : "n/a"}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600 font-medium">Remarks</span>
              <span className="text-gray-700">
                {assignment.submission && assignment.submission.remarks
                  ? assignment.submission.remarks
                  : "n/a"}
              </span>
            </div>

            {/* Display Submission Files */}
            {assignment.submission &&
              assignment.submission.attachments &&
              assignment.submission.attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-gray-600 font-medium mb-3">
                    Submission Files:
                  </h4>
                  <ul className="space-y-2">
                    {assignment.submission.attachments.map((file, index) => (
                      <li
                        key={index}
                        className="border border-gray-100 rounded-md"
                      >
                        <button
                          onClick={() => openFile(file.fileUrl)}
                          className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 rounded-md transition"
                        >
                          {getFileIcon(file.fileType)}
                          <span className="text-blue-600 hover:underline flex-1">
                            {file.fileName}
                          </span>
                          <Download className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Teacher's Feedback */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-800">
            Teacher&apos;s Feedback
          </h3>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600 font-medium">Grade</span>
              <span className="text-gray-700">n/a</span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600 font-medium">Remarks</span>
              <span className="text-gray-700">
                No remarks provided by the teacher yet!
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600 font-medium">
                Attachments/Links
              </span>
              <span className="text-gray-700">n/a</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && (
        <SubmitAssignment
          assignmentId={assignmentId}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
};

export default StdSpecificAssignment;
