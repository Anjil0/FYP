import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import {
  Paperclip,
  User,
  Calendar,
  FileText,
  Download,
  Loader2,
  AlertTriangle,
  BookOpen,
  Clock,
  CheckCircle,
  Info,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  Edit,
  XCircle,
  Send,
  AlertCircle,
} from "lucide-react";
import baseUrl from "../config/config";

const AssignmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignmentData, setAssignmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackGrade, setFeedbackGrade] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/assignments/getSpecificAssignment/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.IsSuccess) {
          setAssignmentData(response.data.Result);
        } else {
          throw new Error(
            response.data.ErrorMessage?.[0] ||
              "Failed to fetch assignment details"
          );
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching assignment details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAssignmentDetails();
    }
  }, [id, token]);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-blue-50">
        <div className="text-center">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <Loader2 className="animate-spin text-primary-500 w-12 h-12 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">
              Loading assignment details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-6 text-center bg-blue-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md">
          <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Unable to Load Assignment
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-primary-500 text-black bg-yellow-100 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // No Data State
  if (!assignmentData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-6 text-center bg-blue-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md">
          <AlertTriangle className="text-yellow-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Assignment Found
          </h2>
          <p className="text-gray-600">
            The assignment you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unsubmited";

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

  const getDueStatus = () => {
    if (
      assignmentData.status === "completed" ||
      assignmentData.status === "reviewed"
    ) {
      return {
        text: "Assignment completed",
        color: "text-green-400",
      };
    }
    if (assignmentData.status === "unsubmitted") {
      return {
        text: "",
        color: "text-red-700",
      };
    }

    const now = new Date();
    const dueDate = new Date(assignmentData.dueDate);
    const timeDiff = dueDate - now;

    if (timeDiff <= 0) {
      // If assignment is past due but not completed
      const daysPast = Math.abs(Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
      return {
        text: `Overdue by ${daysPast} day${daysPast !== 1 ? "s" : ""}`,
        color: "text-red-600",
      };
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (days < 2) {
      return {
        text: `Due soon: ${days > 0 ? `${days} day ` : ""}${hours} hour${
          hours !== 1 ? "s" : ""
        } remaining`,
        color: "text-amber-600",
      };
    } else {
      return {
        text: `Due in ${days} days`,
        color: "text-green-600",
      };
    }
  };

  const dueStatus = getDueStatus();

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (!fileType) return <Paperclip className="text-gray-500" />;

    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="text-red-500" />;
      case "image":
        return <FileText className="text-blue-500" />;
      default:
        return <Paperclip className="text-gray-500" />;
    }
  };

  // Render file attachment
  const renderAttachment = (attachment) => (
    <div
      key={attachment._id}
      className="flex items-center justify-between p-4 bg-white rounded-lg mb-3 border border-gray-200 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-center space-x-3">
        <div className="bg-blue-50 p-3 rounded-lg">
          {getFileIcon(attachment.fileType)}
        </div>
        <div>
          <span className="text-sm font-medium text-gray-800">
            {attachment.fileName}
          </span>
          <p className="text-xs text-gray-500">
            {attachment.fileType?.toUpperCase() || "FILE"} •{" "}
            {new Date(attachment.uploadedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <a
          href={attachment.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg flex items-center transition-colors"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </a>
      </div>
    </div>
  );

  // Handle providing feedback
  const handleProvideFeedback = async () => {
    // Check if student has submitted any work
    if (assignmentData.status === "unsubmitted") {
      toast.error("Cannot provide feedback until student submits work", {
        description: "Remind the student to submit their work first",
        icon: <AlertCircle className="text-red-500" />,
      });
      return;
    }
    if (assignmentData.status === "submitted") {
      toast.error(
        "Cannot provide feedback until the date of assignment is finished"
      );
      return;
    }

    // Validate feedback text
    if (!feedbackText.trim()) {
      toast.warning("Please enter feedback before submitting", {
        description: "Feedback text is required",
        icon: <AlertCircle className="text-yellow-500" />,
      });
      return;
    }

    try {
      setSubmittingFeedback(true);

      const response = await axios.post(
        `${baseUrl}/api/assignments/feedback/${id}`,
        {
          content: feedbackText,
          grade: feedbackGrade || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.IsSuccess) {
        toast.success("Feedback submitted successfully");

        // Refresh the assignment data
        const updatedResponse = await axios.get(
          `${baseUrl}/api/assignments/getSpecificAssignment/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (updatedResponse.data.IsSuccess) {
          setAssignmentData(updatedResponse.data.Result);
          setFeedbackText("");
          setIsEditingFeedback(false);
          setFeedbackGrade(null);
        }
      } else {
        throw new Error(
          response.data.ErrorMessage?.[0] || "Failed to submit feedback"
        );
      }
    } catch (err) {
      toast.error("Failed to submit feedback", {
        description: err.message || "Please try again later",
        icon: <AlertCircle className="text-red-500" />,
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="bg-blue-50 min-h-screen pb-8">
      <Toaster richColors />
      <div className="max-w-6xl mx-auto pt-6 px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <a
            href="/tutorDashboard"
            className="hover:text-primary-600 transition-colors"
          >
            Dashboard
          </a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <a
            href="/tutorAssignment"
            className="hover:text-primary-600 transition-colors"
          >
            Assignments
          </a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-700 font-medium">Assignment Details</span>
        </div>

        {/* Header Card */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className={`font-bold ${dueStatus.color}`}>
                  {dueStatus.text}
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-6">
                {assignmentData.title}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">Student</p>
                    <p className="font-semibold">
                      {assignmentData.studentId?.username || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">Subject</p>
                    <p className="font-semibold">{assignmentData.subject}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">Due Date</p>
                    <p className="font-semibold">
                      {formatDate(assignmentData.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">Created</p>
                    <p className="font-semibold">
                      {formatDate(assignmentData.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Student Information Card */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-blue-500 mr-4">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="font-semibold text-gray-800 mr-3">
                      Student: {assignmentData.studentId?.username || "Unknown"}
                    </h3>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Active Student
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Booking ID: {assignmentData.bookingId}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {assignmentData.status === "assigned" && (
                  <button
                    className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center mr-3"
                    onClick={() => {
                      navigate(`/assignments/edit/${id}`);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Assignment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Nav and Details */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
              <div className="border-b">
                <nav className="flex">
                  {[
                    {
                      id: "details",
                      icon: <Info className="w-4 h-4 mr-2" />,
                      label: "Assignment Details",
                    },
                    {
                      id: "attachments",
                      icon: <Paperclip className="w-4 h-4 mr-2" />,
                      label: "Attachments",
                    },
                    {
                      id: "submission",
                      icon: <Send className="w-4 h-4 mr-2" />,
                      label: "Submission",
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-medium text-sm transition-colors duration-200 flex items-center
                        ${
                          activeTab === tab.id
                            ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Details Tab */}
                {activeTab === "details" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <Info className="mr-2 text-blue-500" /> Assignment
                        Description
                      </h2>
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                          {assignmentData.description ||
                            "No description provided"}
                        </p>
                      </div>

                      {/* Assignment Timeline */}
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Clock className="mr-2 text-blue-500 w-5 h-5" />{" "}
                          Assignment Timeline
                        </h3>
                        <div className="relative pl-8 border-l-2 border-gray-200 space-y-8 py-2">
                          <div className="relative">
                            <div className="absolute -left-[17px] w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                            <h4 className="text-md ml-6 font-medium text-gray-800">
                              Assignment Created
                            </h4>
                            <p className="text-sm ml-6 text-gray-500 mt-1">
                              {formatDate(assignmentData.createdAt)}
                            </p>
                          </div>

                          <div className="relative">
                            <div className="absolute -left-[17px] w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-blue-500" />
                            </div>
                            <h4 className="text-md ml-6 font-medium text-gray-800">
                              Assignment Due
                            </h4>
                            <p className="text-sm ml-6 text-gray-500 mt-1">
                              {formatDate(assignmentData.dueDate)}
                            </p>
                            <p
                              className={`text-sm ml-6 font-medium mt-1 ${dueStatus.color}`}
                            >
                              {dueStatus.text}
                            </p>
                          </div>

                          {assignmentData.status === "completed" ||
                          assignmentData.status === "reviewed" ? (
                            <div className="relative">
                              <div className="absolute -left-[17px] w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </div>
                              <h4 className="text-md ml-6 font-medium text-gray-800">
                                Assignment Completed
                              </h4>
                              <p className="text-sm ml-6 text-gray-500 mt-1">
                                {formatDate(
                                  assignmentData.submission?.submittedAt
                                )}
                              </p>
                            </div>
                          ) : assignmentData.status === "unsubmitted" ? (
                            <div className="relative">
                              <div className="absolute -left-[17px] w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
                                <XCircle className="w-4 h-4 text-red-500" />
                              </div>
                              <h4 className="text-md ml-6 font-medium text-red-500">
                                Assignment Unsubmitted
                              </h4>
                              <p className="text-sm ml-6 text-red-500 mt-1">
                                No submission received
                              </p>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="absolute -left-[17px] w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-gray-400" />
                              </div>
                              <h4 className="text-md ml-6 font-medium text-gray-400">
                                Pending Completion
                              </h4>
                              <p className="text-sm ml-6 text-gray-400 mt-1">
                                Waiting for student submission
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments Tab */}
                {activeTab === "attachments" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Paperclip className="mr-2 text-blue-500" />
                      Assignment Attachments
                      <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {assignmentData.attachments.length}
                      </span>
                    </h2>

                    {assignmentData.attachments &&
                    assignmentData.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {assignmentData.attachments.map(renderAttachment)}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <Paperclip className="mx-auto h-16 w-16 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-lg font-medium">
                          No attachments available
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          No files have been attached to this assignment
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submission Tab */}
                {activeTab === "submission" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Send className="mr-2 text-blue-500" /> Student Submission
                    </h2>

                    {assignmentData.submission ? (
                      <div className="space-y-4">
                        <div
                          className={`border rounded-lg p-4 mb-6 ${
                            assignmentData.status === "completed"
                              ? "bg-green-50 border-green-200"
                              : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-center">
                            {assignmentData.status === "reviewed" ? (
                              <CheckCircle className="text-green-500 w-6 h-6 mr-3" />
                            ) : (
                              <Clock className="text-yellow-500 w-6 h-6 mr-3" />
                            )}
                            <div>
                              <p
                                className={`font-medium ${
                                  assignmentData.status === "reviewed"
                                    ? "text-green-700"
                                    : "text-yellow-700"
                                }`}
                              >
                                {assignmentData.status === "reviewed"
                                  ? "Reviewed"
                                  : "Completed (Pending Review)"}
                              </p>
                              <p
                                className={`text-sm ${
                                  assignmentData.status === "reviewed"
                                    ? "text-green-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                Submitted{" "}
                                {formatDate(
                                  assignmentData.submission.submittedAt
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Student's remarks - Fixed display */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                          <h3 className="text-md font-medium text-gray-800 mb-2">
                            Student&apos;s Remarks:
                          </h3>
                          <p className="text-gray-700 whitespace-pre-line">
                            {assignmentData.submission.remarks ||
                              "No remarks provided"}
                          </p>
                        </div>

                        {/* Submission attachments */}
                        <div>
                          <h3 className="text-md font-medium text-gray-800 mb-3">
                            Submitted Files:
                          </h3>
                          <div className="space-y-2">
                            {assignmentData.submission.attachments.length >
                            0 ? (
                              assignmentData.submission.attachments.map(
                                renderAttachment
                              )
                            ) : (
                              <p>No Submitted attachments available.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : assignmentData.status === "unsubmitted" ? (
                      <div className="space-y-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center">
                            <Clock className="text-yellow-500 w-6 h-6 mr-3" />
                            <div>
                              <p className="text-yellow-700 font-medium">
                                No Submission
                              </p>
                              <p className="text-yellow-600 text-sm">
                                Student hasn&apos;t submitted their work
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                          <Send className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                          <p className="text-gray-700 text-lg font-medium">
                            No Submission Received
                          </p>
                          <p className="text-gray-500 text-sm mt-1 mb-6">
                            The student hasn&apos;t uploaded any files for this
                            assignment
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center">
                            <Clock className="text-yellow-500 w-6 h-6 mr-3" />
                            <div>
                              <p className="text-yellow-700 font-medium">
                                Awaiting Submission
                              </p>
                              <p className="text-yellow-600 text-sm">
                                Student hasn&apos;t submitted their work yet
                              </p>
                            </div>
                            <div className="ml-auto">
                              <button
                                onClick={() => {
                                  toast.info("Reminder sent to student", {
                                    description:
                                      "Student has been notified to submit their work",
                                  });
                                }}
                                className="bg-white text-yellow-600 border border-yellow-300 px-3 py-1 rounded-lg text-sm hover:bg-yellow-50"
                              >
                                Send Reminder
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                          <Send className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                          <p className="text-gray-700 text-lg font-medium">
                            No Submission Yet
                          </p>
                          <p className="text-gray-500 text-sm mt-1 mb-6">
                            The student hasn&apos;t uploaded any files for this
                            assignment
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Feedback */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
              <div className="bg-blue-50 p-4 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <MessageSquare className="mr-2 text-blue-500 w-5 h-5" />{" "}
                  Provide Feedback
                </h2>
              </div>
              <div className="p-5">
                {/* Status notice */}
                {assignmentData.status === "completed" ? (
                  <div className="bg-green-50 rounded-lg p-3 mb-5">
                    <p className="text-sm text-green-700 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Assignment completed - Ready for feedback
                    </p>
                  </div>
                ) : assignmentData.status === "reviewed" ? (
                  <div className="bg-blue-50 rounded-lg p-3 mb-5">
                    <p className="text-sm text-blue-700 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                      Assignment reviewed - Feedback can be updated
                    </p>
                  </div>
                ) : assignmentData.status === "unsubmitted" ? (
                  <div className="bg-yellow-50 rounded-lg p-3 mb-5">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-yellow-700 flex items-center">
                        <XCircle className="w-4 h-4 mr-2 text-yellow-500" />
                        Student has not submitted their work
                      </p>
                    </div>
                    <p className="text-xs ml-6 text-yellow-600 mt-1">
                      Feedback can be provided after submission and completion
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-3 mb-5">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-yellow-700 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                        Assignment in progress
                      </p>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      Feedback can be provided after assignment completion
                    </p>
                  </div>
                )}

                {/* Display existing feedback if available */}
                {assignmentData.feedback && assignmentData.feedback.content && (
                  <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                      Your Feedback
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line mb-2">
                      {assignmentData.feedback.content}
                    </p>
                    {assignmentData.feedback.grade && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">
                          Grade:{" "}
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                          {assignmentData.feedback.grade}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 text-right">
                      <p className="text-xs text-gray-500">
                        Provided on{" "}
                        {formatDate(assignmentData.feedback.providedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Feedback form */}
                {!assignmentData.feedback?.content || isEditingFeedback ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Feedback
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="6"
                        placeholder="Write your feedback here..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade (optional)
                      </label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={feedbackGrade || ""}
                        onChange={(e) => setFeedbackGrade(e.target.value)}
                      >
                        <option value="">Select a grade</option>
                        <option value="A">A - Excellent</option>
                        <option value="B">B - Good</option>
                        <option value="C">C - Satisfactory</option>
                        <option value="D">D - Needs Improvement</option>
                        <option value="F">F - Unsatisfactory</option>
                      </select>
                    </div>

                    <div className="flex gap-3">
                      {isEditingFeedback && (
                        <button
                          onClick={() => {
                            // Reset the form and exit editing mode
                            setIsEditingFeedback(false);
                            setFeedbackText(
                              assignmentData.feedback?.content || ""
                            );
                            setFeedbackGrade(
                              assignmentData.feedback?.grade || null
                            );
                          }}
                          className="w-1/2 py-3 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center font-medium hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={handleProvideFeedback}
                        disabled={
                          !["completed", "reviewed"].includes(
                            assignmentData.status
                          ) || submittingFeedback
                        }
                        className={`${
                          isEditingFeedback ? "w-1/2" : "w-full"
                        } py-3 rounded-lg flex items-center justify-center font-medium transition-colors ${
                          !["completed", "reviewed"].includes(
                            assignmentData.status
                          ) || submittingFeedback
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      >
                        {submittingFeedback ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            {!["completed", "reviewed"].includes(
                              assignmentData.status
                            )
                              ? "Available after completion"
                              : isEditingFeedback
                              ? "Update Feedback"
                              : "Provide Feedback"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setIsEditingFeedback(true);
                        setFeedbackText(assignmentData.feedback.content);
                        setFeedbackGrade(assignmentData.feedback.grade || "");
                      }}
                      className="w-full py-3 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Feedback
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white shadow-md rounded-xl p-4 flex flex-wrap justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;
