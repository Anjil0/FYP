/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Check,
  ExternalLink,
  RefreshCw,
  Trash2, // Added Trash2 icon for delete functionality
} from "lucide-react";
import { toast, Toaster } from "sonner";
import axios from "axios";
import baseUrl from "../config/config";
import { useLoading } from "../config/LoadingContext";

const SubmitAssignment = ({ assignmentId, onClose }) => {
  const { setLoading } = useLoading();
  const [remarks, setRemarks] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const token = localStorage.getItem("accessToken");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/api/assignments/getSpecificAssignment/${assignmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const assignmentData = response.data.Result;
        setAssignment(assignmentData);

        // Check if assignment has already been submitted
        if (
          assignmentData.submission &&
          (assignmentData.status === "submitted" ||
            assignmentData.status === "overdue")
        ) {
          setIsAlreadySubmitted(true);

          // Load existing remarks
          if (assignmentData.submission.remarks) {
            setRemarks(assignmentData.submission.remarks);
          }

          // Load existing attachments
          if (
            assignmentData.submission.attachments &&
            assignmentData.submission.attachments.length > 0
          ) {
            setExistingAttachments(assignmentData.submission.attachments);
          }
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error);
        toast.error(`Failed to load assignment details: ${error.message}`);
      }
    };

    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId, token]);

  const validateFile = (file) => {
    // Check file type (only PDF and images allowed)
    const fileExt = file.name.split(".").pop().toLowerCase();
    const isValidType = ["jpg", "jpeg", "png", "gif", "bmp", "pdf"].includes(
      fileExt
    );

    // Check file size (max 50MB)
    const isValidSize = file.size <= 50 * 1024 * 1024;

    return {
      isValid: isValidType && isValidSize,
      errorMessage: !isValidType
        ? "Only image and PDF files are allowed"
        : !isValidSize
        ? "File size exceeds 50MB limit"
        : null,
    };
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Check if adding these files would exceed the max count of 3
    const totalFiles =
      existingAttachments.length + attachments.length + files.length;
    if (totalFiles > 3) {
      toast.error("Maximum 3 files allowed", {
        description: `You can only upload ${
          3 - existingAttachments.length - attachments.length
        } more file(s)`,
      });
      return;
    }

    // Validate each file
    const invalidFiles = [];
    const validFiles = [];

    files.forEach((file) => {
      const { isValid, errorMessage } = validateFile(file);
      if (!isValid) {
        invalidFiles.push({ name: file.name, error: errorMessage });
      } else {
        validFiles.push(file);
      }
    });

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach((file) => {
        toast.error(`${file.name}: ${file.error}`);
      });
    }

    // Process valid files
    if (validFiles.length > 0) {
      const newAttachments = validFiles.map((file) => ({
        file: file, // Store the actual file object for upload
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file),
      }));

      setAttachments([...attachments, ...newAttachments]);
      toast.success(`${validFiles.length} file(s) ready for upload`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (name) => {
    setAttachments(
      attachments.filter((attachment) => attachment.name !== name)
    );
    toast.info("Attachment removed");
  };

  // New function to delete existing attachment
  const deleteExistingAttachment = async (attachmentId) => {
    if (!attachmentId || !assignment?._id) {
      toast.error("Cannot delete attachment: Missing information");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${baseUrl}/api/assignments/deleteAssignmentsAttachments/${assignment._id}/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.IsSuccess) {
        // Remove the deleted attachment from the state
        setExistingAttachments(
          existingAttachments.filter(
            (attachment) => attachment._id !== attachmentId
          )
        );
        toast.success("Attachment deleted successfully");
      } else {
        toast.error("Failed to delete attachment", {
          description: response.data.ErrorMessage || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      const errorMessage = error.response?.data?.ErrorMessage || error.message;
      toast.error(`Failed to delete attachment: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // If resubmitting without any changes
    if (
      isAlreadySubmitted &&
      attachments.length === 0 &&
      remarks === assignment.submission.remarks
    ) {
      toast.info("No changes detected. Make changes to resubmit.");
      return;
    }

    // Check for content to submit
    if (
      attachments.length === 0 &&
      !remarks.trim() &&
      existingAttachments.length === 0
    ) {
      toast.warning("Please add remarks or attachments before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("remarks", remarks);

      // Add files to formData with the correct field name
      attachments.forEach((attachment) => {
        formData.append("files", attachment.file);
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Send submission to server
      const response = await axios.post(
        `${baseUrl}/api/assignments/submitAssignment/${assignmentId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.IsSuccess) {
        toast.success(
          isAlreadySubmitted
            ? "Assignment resubmitted successfully"
            : "Assignment submitted successfully",
          {
            description: "Your tutor will review your submission",
          }
        );
        window.location.reload();
      } else {
        toast.error("Failed to submit assignment", {
          description: response.data.ErrorMessage || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      const errorMessage = error.response?.data?.ErrorMessage || error.message;
      toast.error(`Failed to submit assignment: ${errorMessage}`);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Format file size to human-readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Function to detect file type from URL or extension
  const getFileIcon = (fileName, fileType) => {
    if (fileType === "image") {
      return (
        <img
          src="/api/placeholder/30/30"
          alt="thumbnail"
          className="h-5 w-5 object-cover rounded mr-2"
        />
      );
    }
    return <FileText className="h-5 w-5 text-gray-400 mr-2" />;
  };

  // Function to open file in new tab
  const openFileInNewTab = (url) => {
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <Toaster richColors />
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              {isAlreadySubmitted ? "Edit Submission" : "Submit Assignment"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-grow p-6">
          {assignment && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {assignment.title}
              </h3>
              <div className="text-sm text-gray-600">
                {assignment.description && (
                  <p className="mb-2">{assignment.description}</p>
                )}
                {assignment.dueDate && (
                  <p className="flex items-center text-red-500">
                    <span className="mr-1">Due:</span>
                    {new Date(assignment.dueDate).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="remarks"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Remarks
              </label>
              <textarea
                id="remarks"
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Enter your remarks here"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {/* Existing Attachments Section (if already submitted) */}
            {existingAttachments.length > 0 && (
              <div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Attachments
                  </label>
                </div>
                <ul className="space-y-2 mb-4">
                  {existingAttachments.map((file, index) => (
                    <li
                      key={`existing-${index}`}
                      className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
                    >
                      <div className="flex items-center">
                        {getFileIcon(file.fileName, file.fileType)}
                        <div>
                          <span className="text-sm font-medium text-gray-700 block">
                            {file.fileName}
                          </span>
                          <span className="text-xs text-gray-500">
                            Uploaded on{" "}
                            {new Date(file.uploadedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => openFileInNewTab(file.fileUrl)}
                          className="text-blue-500 hover:text-blue-700 transition-colors mr-2"
                          title="View file"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteExistingAttachment(file._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete file"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {existingAttachments.length > 0 && (
                  <p className="text-xs text-gray-500 mb-4">
                    Note: You can delete existing attachments using the trash
                    icon.
                  </p>
                )}
              </div>
            )}

            <div>
              <div className="mb-2 flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  {existingAttachments.length > 0
                    ? "Add New Files"
                    : "Your submission"}
                </label>
              </div>

              {/* File upload area - disabled if 3 files already exist */}
              <div
                className={`border-2 border-dashed ${
                  existingAttachments.length + attachments.length >= 3
                    ? "border-gray-200"
                    : "border-gray-300"
                } rounded-md px-6 py-8 text-center`}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp"
                  onChange={handleFileChange}
                  disabled={
                    isUploading ||
                    existingAttachments.length + attachments.length >= 3
                  }
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center ${
                    existingAttachments.length + attachments.length >= 3
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-purple-600 hover:text-purple-500">
                    {isUploading
                      ? "Uploading..."
                      : existingAttachments.length + attachments.length >= 3
                      ? "Maximum files reached (3)"
                      : "Click to upload files"}
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    {existingAttachments.length + attachments.length < 3 &&
                      "Only images and PDF files are allowed"}
                  </span>
                </label>
              </div>

              {/* New Attachments list */}
              {attachments.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {attachments.map((file) => (
                    <li
                      key={file.name}
                      className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <span className="text-sm font-medium text-gray-700 block">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(file.name)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
            disabled={isSubmitting || isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center"
            disabled={isSubmitting || isDeleting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isAlreadySubmitted ? "Resubmitting..." : "Submitting..."}
              </>
            ) : (
              <>
                {isAlreadySubmitted ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {isAlreadySubmitted
                  ? "Resubmit Assignment"
                  : "Submit Assignment"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;
