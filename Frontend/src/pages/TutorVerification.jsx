import { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Shield,
  Calendar,
  MapPin,
  Book,
  Clock,
  Monitor,
  Filter,
  Search,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import Sidebar from "../components/AdminSidebar";
import baseUrl from "/src/config/config";
import { useLoading } from "./../config/LoadingContext";
import { toast, Toaster } from "sonner";

const TutorVerification = () => {
  const { setLoading } = useLoading();
  const [tutors, setTutors] = useState([]);
  const [selectedSection, setSelectedSection] = useState("tutors");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${baseUrl}/api/tutors/getAllTutors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.IsSuccess && response.data.Result.tutors) {
          setTutors(response.data.Result.tutors);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          const errorMessages = error.response.data.ErrorMessage.map(
            (err) => err.message
          ).join(", ");
          toast.error(`${errorMessages}`);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, [setLoading]);

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await axios.post(
        `${baseUrl}/api/tutors/verifyTutor/${id}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.IsSuccess) {
        setTutors(
          tutors.map((tutor) =>
            tutor._id === id ? { ...tutor, isVerified: action } : tutor
          )
        );
        toast.success(
          `Tutor ${
            action === "verified" ? "approved" : "rejected"
          } successfully`
        );
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      console.error("Error performing action on tutor:", error);
      if (error.response && error.response.data) {
        const errorMessages = error.response.data.ErrorMessage.map(
          (err) => err.message
        ).join(", ");
        toast.error(`${errorMessages}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (tutor) => {
    setSelectedTutor(tutor);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTutor(null);
  };

  // Filter tutors based on search term and status
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tutor.education &&
        tutor.education.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || tutor.isVerified === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Education level mapping
  const educationLevelMap = {
    "10_pass": "10th Grade Pass",
    "12_pass": "12th Grade Pass",
    bachelor_running: "Bachelor's (In Progress)",
    bachelor_complete: "Bachelor's Degree",
    master_running: "Master's (In Progress)",
    master_complete: "Master's Degree",
    phd: "PhD",
  };

  // Teaching experience mapping
  const experienceMap = {
    "0-1": "Less than 1 year",
    "1-2": "1-2 years",
    "2-5": "2-5 years",
    "5+": "More than 5 years",
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      {/* Sidebar */}
      <Sidebar
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Tutor Verification Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Review and verify tutor applications
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-700">Total Tutors</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {tutors.length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-yellow-50 rounded-lg mr-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <h3 className="font-semibold text-gray-700">
                  Pending Verification
                </h3>
              </div>
              <p className="text-3xl font-bold text-yellow-500">
                {tutors.filter((t) => t.isVerified === "pending").length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-green-50 rounded-lg mr-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-700">Verified Tutors</h3>
              </div>
              <p className="text-3xl font-bold text-green-500">
                {tutors.filter((t) => t.isVerified === "verified").length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center relative md:w-1/3">
                <Search className="h-5 w-5 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Search by name or education"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tutors Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  Tutor Applications
                </h2>
                <div className="flex items-center space-x-2">
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Sort by newest</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredTutors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No Tutors Found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    There are no tutors matching your criteria at the moment.
                  </p>
                  <button
                    className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profile
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qualification
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied On
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTutors.map((tutor) => (
                      <tr
                        key={tutor._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 mr-4">
                              <img
                                src={tutor.image}
                                alt={`${tutor.username}`}
                                className="h-12 w-12 rounded-full object-cover border border-gray-200"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {tutor.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <div className="text-gray-900 mb-1">
                              {tutor.email}
                            </div>
                            <div className="text-gray-600">
                              {tutor.phoneNumber}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <div className="text-gray-900 mb-1">
                              {educationLevelMap[tutor.education] ||
                                tutor.education}
                            </div>
                            <div className="text-gray-600">
                              {experienceMap[tutor.teachingExperience] ||
                                tutor.teachingExperience}{" "}
                              experience
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium
                              ${
                                tutor.isVerified === "verified"
                                  ? "bg-green-100 text-green-800"
                                  : tutor.isVerified === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {tutor.isVerified === "verified"
                              ? "Verified"
                              : tutor.isVerified === "rejected"
                              ? "Rejected"
                              : "Pending"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {formatDate(tutor.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <button
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              onClick={() => openDetailModal(tutor)}
                            >
                              <Eye className="h-5 w-5" />
                            </button>

                            {tutor.isVerified === "pending" && (
                              <>
                                <button
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                  onClick={() =>
                                    handleAction(tutor._id, "verified")
                                  }
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                  onClick={() =>
                                    handleAction(tutor._id, "rejected")
                                  }
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tutor Detail Modal */}
      {isDetailModalOpen && selectedTutor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Tutor Application Details
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeDetailModal}
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center mb-8 gap-6">
                <img
                  src={selectedTutor.image}
                  alt={selectedTutor.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                />

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    {selectedTutor.username}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {selectedTutor.subject && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <Book className="h-4 w-4 mr-1" />
                        <span>{selectedTutor.subject}</span>
                      </div>
                    )}

                    <div className="flex items-center text-gray-600 text-sm">
                      <Monitor className="h-4 w-4 mr-1" />
                      <span>{selectedTutor.teachingLocation}</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{selectedTutor.address}</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{selectedTutor.age} years old</span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium
                        ${
                          selectedTutor.isVerified === "verified"
                            ? "bg-green-100 text-green-800"
                            : selectedTutor.isVerified === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {selectedTutor.isVerified === "verified"
                        ? "Verified"
                        : selectedTutor.isVerified === "rejected"
                        ? "Rejected"
                        : "Pending Verification"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Contact Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Contact Information
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-24 text-sm font-medium text-gray-500">
                        Email:
                      </div>
                      <div className="flex-1 text-gray-800">
                        {selectedTutor.email}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-24 text-sm font-medium text-gray-500">
                        Phone:
                      </div>
                      <div className="flex-1 text-gray-800">
                        {selectedTutor.phoneNumber}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-24 text-sm font-medium text-gray-500">
                        Address:
                      </div>
                      <div className="flex-1 text-gray-800">
                        {selectedTutor.address}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-24 text-sm font-medium text-gray-500">
                        Gender:
                      </div>
                      <div className="flex-1 text-gray-800 capitalize">
                        {selectedTutor.gender}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qualifications */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Qualifications
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-28 text-sm font-medium text-gray-500">
                        Education:
                      </div>
                      <div className="flex-1 text-gray-800">
                        {educationLevelMap[selectedTutor.education] ||
                          selectedTutor.education}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-28 text-sm font-medium text-gray-500">
                        Experience:
                      </div>
                      <div className="flex-1 text-gray-800">
                        {experienceMap[selectedTutor.teachingExperience] ||
                          selectedTutor.teachingExperience}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-28 text-sm font-medium text-gray-500">
                        Grade Level:
                      </div>
                      <div className="flex-1 text-gray-800 capitalize">
                        {selectedTutor.grade} school
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-28 text-sm font-medium text-gray-500">
                        Teaching Mode:
                      </div>
                      <div className="flex-1 text-gray-800 capitalize">
                        {selectedTutor.teachingLocation}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">About</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700">{selectedTutor.description}</p>
                </div>
              </div>

              {/* Certificate */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Certificate
                </h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <img
                    src={selectedTutor.certificateImage}
                    alt={`${selectedTutor.username}'s certificate`}
                    className="max-h-96 object-contain rounded-lg mx-auto border border-gray-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {selectedTutor.isVerified === "pending" && (
                <div className="flex justify-end gap-4 border-t border-gray-200 pt-6">
                  <button
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    onClick={closeDetailModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center"
                    onClick={() => handleAction(selectedTutor._id, "rejected")}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject
                  </button>
                  <button
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center"
                    onClick={() => handleAction(selectedTutor._id, "verified")}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorVerification;
