import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  BookOpen,
  User,
  Paperclip,
  X,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Toaster, toast } from "sonner";
import baseUrl from "../config/config";
import { useLoading } from "../config/LoadingContext";

const EditAssignment = () => {
  const { setLoading } = useLoading();
  const navigate = useNavigate();
  const { id } = useParams();
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // States
  const [bookings, setBookings] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [assignment, setAssignmentData] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form setup with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const token = localStorage.getItem("accessToken");

  // Fetch assignment details to edit
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setAssignmentLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/assignments/getSpecificAssignment/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.IsSuccess) {
          const assignmentData = response.data.Result;
          setAssignmentData(assignmentData);
          // Pre-fill form fields
          setValue("title", assignmentData.title);
          setValue("description", assignmentData.description);
          setValue("dueDate", formatDateForInput(assignmentData.dueDate));
          setValue("bookingId", assignmentData.bookingId);

          // Set existing attachments
          if (assignmentData.attachments) {
            setExistingAttachments(assignmentData.attachments);
          }

          await fetchBookingDetails(assignmentData.bookingId);
        } else {
          throw new Error(
            response.data.ErrorMessage?.[0] ||
              "Failed to fetch assignment details"
          );
        }
      } catch (err) {
        toast.error("Failed to load assignment", {
          description: err.response?.data?.ErrorMessage || err.message,
        });
        console.error("Error fetching assignment details:", err);
      } finally {
        setAssignmentLoading(false);
      }
    };

    if (id) {
      fetchAssignmentDetails();
    }
  }, [id, token, setValue, setLoading]);

  // Format date for datetime-local input
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);

    // Convert to local timezone (Asia/Kathmandu)
    const localDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);

    // Extract parts and format as "YYYY-MM-DDTHH:MM"
    const year = localDate.find((p) => p.type === "year").value;
    const month = localDate.find((p) => p.type === "month").value;
    const day = localDate.find((p) => p.type === "day").value;
    const hour = localDate.find((p) => p.type === "hour").value;
    const minute = localDate.find((p) => p.type === "minute").value;

    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // Fetch specific booking details
  const fetchBookingDetails = async (bookingId) => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/bookings/tutorBookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (
        response.data &&
        response.data.Result &&
        response.data.Result.bookings
      ) {
        const activeBookings = response.data.Result.bookings.filter(
          (booking) => booking.status === "ongoing" && booking.isActive
        );
        setBookings(activeBookings);

        // Find and select the booking that matches the assignment
        const matchingBooking = activeBookings.find(
          (booking) => booking._id === bookingId
        );

        if (matchingBooking) {
          setSelectedBooking(matchingBooking);
        }
      }
    } catch (err) {
      toast.error("Error fetching booking details");
      console.error("Error fetching booking details:", err);
    }
  };

  // Select a booking
  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    setValue("bookingId", booking._id);
    setDropdownOpen(false);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    // Check if any files were selected
    if (files.length === 0) return;

    // Check maximum number of files
    if (files.length + attachments.length > 10) {
      toast.error("Too many files", {
        description: "You can only upload a maximum of 10 files",
      });
      return;
    }

    // Validate file types
    const newFiles = [];
    const rejectedFiles = [];

    files.forEach((file) => {
      const fileExt = file.name.split(".").pop().toLowerCase();
      const isValidType = ["jpg", "jpeg", "png", "gif", "bmp", "pdf"].includes(
        fileExt
      );

      // Check file size (10MB limit)
      const isValidSize = file.size <= 10 * 1024 * 1024;

      if (isValidType && isValidSize) {
        newFiles.push(file);
      } else {
        rejectedFiles.push({
          name: file.name,
          reason: !isValidType ? "Invalid file type" : "File too large",
        });
      }
    });

    // Show error messages for rejected files
    if (rejectedFiles.length > 0) {
      toast.error(`${rejectedFiles.length} files couldn't be added`, {
        description: rejectedFiles
          .map((f) => `${f.name}: ${f.reason}`)
          .join(", "),
      });
    }

    // Process valid files
    if (newFiles.length > 0) {
      const processedFiles = newFiles.map((file) => {
        const fileExt = file.name.split(".").pop().toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "gif", "bmp"].includes(fileExt);

        return {
          file,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: isImage ? "image" : "pdf",
          uploadedAt: new Date(),
          isNew: true,
        };
      });

      setAttachments([...attachments, ...processedFiles]);

      if (newFiles.length > 0) {
        toast.success(`${newFiles.length} files added`, {
          description: "Files ready to upload",
        });
      }
    }
  };

  // Remove attachment
  const removeAttachment = async (index, e, isExisting = false) => {
    try {
      if (e) {
        e.stopPropagation();
      }

      if (isExisting) {
        // Get the attachment ID from the existing attachments
        const attachmentToDelete = existingAttachments[index];
        const attachmentId = attachmentToDelete._id;

        // Show loading toast
        const loadingToast = toast.loading("Removing attachment...");

        // Call the API to delete the attachment
        const response = await axios.delete(
          `${baseUrl}/api/assignments/deleteAssignmentsAttachments/${assignment._id}/${attachmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (response.data.IsSuccess) {
          // Remove from existing attachments in local state
          const newExistingAttachments = [...existingAttachments];
          newExistingAttachments.splice(index, 1);
          setExistingAttachments(newExistingAttachments);

          toast.success("Attachment removed", {
            description: "The Attachments has been permanently removed",
          });
        } else {
          toast.error("Failed to remove attachment", {
            description: response.data.ErrorMessage || "Please try again",
          });
        }
      } else {
        // Remove from new attachments (local only, no API call needed)
        const newAttachments = [...attachments];
        URL.revokeObjectURL(newAttachments[index].fileUrl);
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
        toast.success("New file removed");
      }
    } catch (error) {
      console.error("Error removing attachment:", error);
      toast.error("Error removing attachment", {
        description:
          error.response?.data?.ErrorMessage || "Please try again later",
      });
    }
  };

  // Submit the form
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Create FormData for submission with files
      const formData = new FormData();

      // Add basic assignment data
      formData.append("bookingId", selectedBooking._id);
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("dueDate", data.dueDate);
      formData.append("subject", selectedBooking.timeSlotId.subjectName);

      // Keep track of existing attachments to retain
      const retainedAttachmentIds = existingAttachments.map((att) => att._id);
      formData.append(
        "retainAttachments",
        JSON.stringify(retainedAttachmentIds)
      );

      // Add new files to FormData
      attachments.forEach((attachment) => {
        formData.append("files", attachment.file);
      });

      // API call to update assignment
      const response = await axios.put(
        `${baseUrl}/api/assignments/updateAssignment/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.IsSuccess) {
        // Dismiss loading toast and show success toast
        toast.success("Assignment updated!", {
          description: "All changes have been saved successfully",
          action: {
            label: "View",
            onClick: () => navigate(`/assignments/${id}`),
          },
        });

        setTimeout(() => {
          navigate(`/assignments/${id}`);
        }, 2000);
      } else {
        toast.error("Update failed", {
          description:
            response.data?.ErrorMessage || "Failed to update assignment",
        });
      }
    } catch (err) {
      if (
        err.response &&
        err.response.data &&
        err.response.data.ErrorMessage[0]
      ) {
        toast.error(`Error: ${err.response.data.ErrorMessage[0].message}`);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  // Get subject name
  const getSubjectName = (booking) => {
    if (booking.timeSlotId && booking.timeSlotId.subjectName) {
      return booking.timeSlotId.subjectName;
    }
    return "No subject";
  };

  // Get student name
  const getStudentName = (booking) => {
    if (booking.studentId && booking.studentId.username) {
      return booking.studentId.username;
    }
    return "Unknown Student";
  };

  // Filter bookings based on search term
  const filteredBookings = bookings.filter((booking) => {
    const studentName = getStudentName(booking).toLowerCase();
    const subjectName = getSubjectName(booking).toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    return (
      studentName.includes(searchTermLower) ||
      subjectName.includes(searchTermLower)
    );
  });

  if (assignmentLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <Toaster />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Edit Assignment
        </h1>
        <button
          type="button"
          onClick={() => navigate(`/assignments/${id}`)}
          className="px-6 py-3 text-m font-bold rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={submitting}
        >
          Cancel
        </button>
      </div>

      {/* Student Booking Selection Dropdown */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Student
        </h2>

        {bookings.length === 0 ? (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No active bookings found.</p>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`relative w-full bg-white border ${
                selectedBooking ? "border-indigo-500" : "border-gray-300"
              } rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
              disabled={true}
            >
              <div className="flex items-center">
                {selectedBooking ? (
                  <>
                    <span className="flex items-center">
                      <span className="ml-3 block truncate font-medium">
                        {getStudentName(selectedBooking)}:{" "}
                        {getSubjectName(selectedBooking)}
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="ml-3 block truncate text-gray-500">
                    Select a student
                  </span>
                )}
              </div>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md overflow-auto focus:outline-none ring-1 ring-black ring-opacity-5">
                <div className="sticky top-0 z-10 bg-white p-2">
                  <div className="relative">
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <ul className="py-1 overflow-auto text-base">
                  {filteredBookings.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500 text-center">
                      No students match your search
                    </li>
                  ) : (
                    filteredBookings.map((booking) => (
                      <li
                        key={booking._id}
                        className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${
                          selectedBooking?._id === booking._id
                            ? "bg-indigo-50"
                            : ""
                        }`}
                        onClick={() => handleSelectBooking(booking)}
                      >
                        <div className="flex items-center">
                          <span className="font-normal block truncate">
                            <span className="font-medium">
                              {getStudentName(booking)}
                            </span>
                            : {getSubjectName(booking)}
                          </span>
                        </div>

                        {selectedBooking?._id === booking._id && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignment Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        encType="multipart/form-data"
      >
        <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Assignment Details
        </h2>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Assignment Title*
            </label>
            <input
              id="title"
              type="text"
              {...register("title", { required: "Title is required" })}
              className={`w-full rounded-md border ${
                errors.title ? "border-red-500" : "border-gray-300"
              } px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Enter a clear, descriptive title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Brief Description*
            </label>
            <textarea
              id="description"
              {...register("description", {
                required: "Description is required",
              })}
              rows={3}
              className={`w-full rounded-md border ${
                errors.description ? "border-red-500" : "border-gray-300"
              } px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Provide a short overview of this assignment"
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Due Date*
            </label>
            <input
              id="dueDate"
              type="datetime-local"
              {...register("dueDate", { required: "Due date is required" })}
              className={`w-full rounded-md border ${
                errors.dueDate ? "border-red-500" : "border-gray-300"
              } px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.dueDate.message}
              </p>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments (Images & PDFs only)
            </label>

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Existing Files
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {existingAttachments.map((file, index) => (
                    <div key={file._id} className="relative group">
                      <div className="rounded-md border border-gray-200 p-3 bg-gray-50 flex items-center">
                        <div className="flex-shrink-0 mr-2">
                          {file.fileType === "image" ? (
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-red-100 text-red-700 rounded flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-gray-500">Existing file</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeAttachment(index, e, true)}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new files */}
            <div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-1 text-center">
                <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="files"
                    className="relative cursor-pointer font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    <span>Upload new files</span>
                    <input
                      ref={fileInputRef}
                      id="files"
                      name="files"
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif,.bmp,.pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF, BMP, PDF up to 10MB
                </p>
              </div>
            </div>

            {/* New Attachment Preview */}
            {attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  New Files
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {attachments.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="rounded-md border border-gray-200 p-3 bg-gray-50 flex items-center">
                        <div className="flex-shrink-0 mr-2">
                          {file.fileType === "image" ? (
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-red-100 text-red-700 rounded flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {file.file && (file.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent onClick
                            removeAttachment(index, e, false);
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/assignments/${id}`)}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-md border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Updating...
                  </>
                ) : (
                  "Update Assignment"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditAssignment;
