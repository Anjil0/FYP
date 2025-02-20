/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import baseUrl from "/src/config/config";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Book,
  Briefcase,
  CheckCircle,
  Star,
  Phone,
  Mail,
  Clock,
  Filter,
  GraduationCap,
  XCircle,
  ChevronRight,
  Users,
} from "lucide-react";

const TutorListing = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [filters, setFilters] = useState({
    grade: "",
    teachingLocation: "",
    isAvailable: false,
    searchQuery: "",
  });
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    total: 0,
    available: 0,
    verified: 0,
  });

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/tutors/getVerifiedTutors`
        );
        if (response.data.IsSuccess && response.data.Result.tutors) {
          setTutors(response.data.Result.tutors);
          // Calculate stats
          const tutorsData = response.data.Result.tutors;
          setStatsData({
            total: tutorsData.length,
            available: tutorsData.filter((t) => t.isAvailable).length,
            verified: tutorsData.filter((t) => t.isVerified === "verified")
              .length,
          });
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
  }, []);

  // Filter tutors based on search and filters
  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      const matchesSearch =
        !filters.searchQuery ||
        tutor.username
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        tutor.description
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase());

      const matchesGrade = !filters.grade || tutor.grade === filters.grade;

      const matchesLocation =
        !filters.teachingLocation ||
        tutor.teachingLocation === filters.teachingLocation;

      const matchesAvailability = !filters.isAvailable || tutor.isAvailable;

      return (
        matchesSearch && matchesGrade && matchesLocation && matchesAvailability
      );
    });
  }, [tutors, filters]);

  const formatEducation = (education) => {
    return education
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const TutorCard = ({ tutor }) => (
    <div className="group bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <div className="relative">
        <img
          src={tutor.image}
          alt={tutor.username}
          className="w-full h-56 object-cover transform transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
              tutor.isAvailable
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            {tutor.isAvailable ? "Available" : "Unavailable"}
          </span>

          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
              tutor.isVerified === "verified"
                ? "bg-blue-100 text-blue-800"
                : tutor.isVerified === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {tutor.isVerified === "verified" ? (
              <CheckCircle className="w-4 h-4" />
            ) : tutor.isVerified === "rejected" ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            {tutor.isVerified.charAt(0).toUpperCase() +
              tutor.isVerified.slice(1)}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              {tutor.username}
            </h3>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {formatEducation(tutor.education)}
            </p>
          </div>
          <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="ml-1 text-gray-700 font-medium">4.8</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
            <Book className="w-4 h-4 mr-2 text-blue-500" />
            <span className="capitalize">{tutor.grade}</span>
          </div>
          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
            <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
            <span>{tutor.teachingExperience} Years</span>
          </div>
          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
            <span className="capitalize">{tutor.teachingLocation}</span>
          </div>
          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
            <Phone className="w-4 h-4 mr-2 text-blue-500" />
            <span className="font-medium">{tutor.phoneNumber}</span>
          </div>
        </div>

        <p className="text-gray-600 mb-6 line-clamp-2">{tutor.description}</p>

        <div className="flex gap-4">
          <button className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
            <Mail className="w-4 h-4" />
            Contact
          </button>
          <button
            onClick={() => navigate(`/tutors/${tutor._id}`)}
            className="flex-1 border border-blue-500 text-blue-500 py-2.5 px-4 rounded-lg hover:bg-blue-50 transition-colors duration-300 flex items-center justify-center gap-2"
          >
            View Profile
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Find Your Perfect Tutor
          </h1>
          <p className="text-blue-100 text-center text-lg mb-12">
            Connect with experienced and verified tutors for personalized
            learning
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <Users className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-white">
                {statsData.total}
              </h3>
              <p className="text-blue-100">Total Tutors</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-white">
                {statsData.available}
              </h3>
              <p className="text-blue-100">Available Now</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-white">
                {statsData.verified}
              </h3>
              <p className="text-blue-100">Verified Tutors</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by subject, grade, or location..."
              className="w-full pl-12 pr-4 py-4 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters({ ...filters, searchQuery: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container mx-auto px-4 -mt-8 mb-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4 text-gray-700">
            <Filter className="w-5 h-5" />
            <h2 className="font-semibold">Filters</h2>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              className="flex-1 min-w-[200px] p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={filters.grade}
              onChange={(e) =>
                setFilters({ ...filters, grade: e.target.value })
              }
            >
              <option value="">All Grades</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="college">College</option>
            </select>

            <select
              className="flex-1 min-w-[200px] p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={filters.teachingLocation}
              onChange={(e) =>
                setFilters({ ...filters, teachingLocation: e.target.value })
              }
            >
              <option value="">All Locations</option>
              <option value="online">Online</option>
              <option value="physical">Physical</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={filters.isAvailable}
                onChange={(e) =>
                  setFilters({ ...filters, isAvailable: e.target.checked })
                }
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400"
              />
              <span className="text-gray-700">Available Now</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="container mx-auto px-4 mb-6">
        <p className="text-gray-600">
          Showing {filteredTutors.length}{" "}
          {filteredTutors.length === 1 ? "tutor" : "tutors"}
        </p>
      </div>

      {/* Tutors Grid */}
      <div className="container mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredTutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTutors.map((tutor) => (
              <TutorCard key={tutor._id} tutor={tutor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No tutors found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorListing;
