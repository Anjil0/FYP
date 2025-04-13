import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Star,
  Filter,
  ChevronRight,
  X,
  MapPin,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  CheckCircle,
  ThumbsUp,
  BookOpen,
  Clock,
  Heart,
  Share2,
} from "lucide-react";
import axios from "axios";
import baseUrl from "../config/config";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TutorListing = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const [tutors, setTutors] = useState([]);
  const [recommendedTutors, setRecommendedTutors] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [filters, setFilters] = useState({
    grade: "",
    teachingLocation: "",
    isAvailable: false,
    experience: "",
    education: "",
    rating: "",
    searchQuery: "",
  });
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Fetch regular tutors
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/tutors/getVerifiedTutors`
        );
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
  }, []);

  // Fetch recommended tutors if token exists
  useEffect(() => {
    const fetchRecommendedTutors = async () => {
      if (!token) return;

      setLoadingRecommendations(true);
      try {
        const response = await axios.get(
          `${baseUrl}/api/recommendations/recommend/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setRecommendedTutors(response.data);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        // Silently fail for recommendations
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendedTutors();
  }, [token]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("tutorFavorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem("tutorFavorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (tutorId) => {
    setFavorites((prev) => {
      if (prev.includes(tutorId)) {
        return prev.filter((id) => id !== tutorId);
      } else {
        return [...prev, tutorId];
      }
    });

    // Show toast notification
    const isFavorite = favorites.includes(tutorId);
    if (isFavorite) {
      toast.success("Removed from favorites");
    } else {
      toast.success("Added to favorites");
    }
  };

  const experienceToYears = (experience) => {
    if (experience === "0-1") return 0.5;
    if (experience === "1-2") return 1.5;
    if (experience === "2-5") return 3.5;
    if (experience === "5+") return 6;
    return 0;
  };

  // Filter tutors based on search and filters
  const filteredTutors = useMemo(() => {
    let filtered = tutors.filter((tutor) => {
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
      const matchesExperience =
        !filters.experience || tutor.teachingExperience === filters.experience;
      const matchesEducation =
        !filters.education || tutor.education === filters.education;
      const matchesRating =
        !filters.rating ||
        tutor.averageRating >= Number.parseInt(filters.rating);

      return (
        matchesSearch &&
        matchesGrade &&
        matchesLocation &&
        matchesAvailability &&
        matchesExperience &&
        matchesEducation &&
        matchesRating
      );
    });

    // Sort tutors based on activeSort
    if (activeSort === "rating") {
      filtered = [...filtered].sort(
        (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
      );
    } else if (activeSort === "experience") {
      filtered = [...filtered].sort((a, b) => {
        const expA = experienceToYears(a.teachingExperience);
        const expB = experienceToYears(b.teachingExperience);
        return expB - expA;
      });
    }

    return filtered;
  }, [tutors, filters, activeSort]);

  const formatEducation = (education) => {
    return education
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatGrade = (grade) => {
    const gradeMap = {
      primary: "Primary School",
      middle: "Middle School",
      high: "High School",
      college: "College/University",
    };
    return gradeMap[grade] || grade.charAt(0).toUpperCase() + grade.slice(1);
  };

  const formatGender = (gender) => {
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const formatTeachingLocation = (location) => {
    const locationMap = {
      online: "Online Teaching",
      physical: "In-Person Teaching",
      both: "Online & In-Person",
    };
    return locationMap[location] || location;
  };

  const formatExperience = (experience) => {
    const experienceMap = {
      "0-1": "< 1 Year Experience",
      "1-2": "1-2 Years Experience",
      "2-5": "2-5 Years Experience",
      "5+": "5+ Years Experience",
    };
    return experienceMap[experience] || experience;
  };

  const navigateToProfile = (id) => {
    navigate(`/tutors/${id}`);
  };

  const clearFilters = () => {
    setFilters({
      grade: "",
      teachingLocation: "",
      isAvailable: false,
      experience: "",
      education: "",
      rating: "",
      searchQuery: "",
    });
  };

  const shareProfile = (tutor) => {
    if (navigator.share) {
      navigator
        .share({
          title: `Check out ${tutor.username} on TutorEase`,
          text: `I found a great tutor: ${tutor.username}. Check out their profile!`,
          url: `${window.location.origin}/tutors/${tutor._id}`,
        })
        .then(() => toast.success("Shared successfully"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard
        .writeText(`${window.location.origin}/tutors/${tutor._id}`)
        .then(() => toast.success("Link copied to clipboard"))
        .catch(() => toast.error("Failed to copy link"));
    }
  };

  const TutorCard = ({ tutor }) => {
    const isFavorite = favorites.includes(tutor._id);

    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
        <div className="relative">
          {/* Profile Image */}
          <div className="h-64 overflow-hidden">
            <img
              src={tutor.image || "/placeholder.svg"}
              alt={tutor.username}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Availability Badge */}
            {tutor.isAvailable && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Available Now
              </div>
            )}

            {/* Verification Badge */}
            {tutor.isVerified === "verified" && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </div>
            )}

            {/* Rating Badge */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-md flex items-center">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
              {tutor.averageRating || "New"}
            </div>

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(tutor._id);
              }}
              className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md transition-all duration-300 hover:bg-white"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Name and Education */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {tutor.username}
            </h3>
            <p className="text-blue-600 font-medium">
              {formatEducation(tutor.education)}
            </p>
          </div>

          {/* Tutor Details */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 text-indigo-500 mr-2" />
              <span className="text-sm">
                {formatGender(tutor.gender)}, {tutor.age} yrs
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <GraduationCap className="w-4 h-4 text-indigo-500 mr-2" />
              <span className="text-sm">{formatGrade(tutor.grade)}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <Briefcase className="w-4 h-4 text-indigo-500 mr-2" />
              <span className="text-sm">
                {formatExperience(tutor.teachingExperience)}
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 text-indigo-500 mr-2" />
              <span className="text-sm">
                {formatTeachingLocation(tutor.teachingLocation)}
              </span>
            </div>

            <div className="flex items-start text-gray-600 col-span-2">
              <MapPin className="w-4 h-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{tutor.address}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => navigateToProfile(tutor._id)}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 font-medium flex items-center justify-center"
            >
              View Profile
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                shareProfile(tutor);
              }}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RecommendedTutorCard = ({ tutor }) => {
    const isFavorite = favorites.includes(tutor.id);

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border-2 border-transparent hover:border-indigo-200">
        {/* Colored header based on recommendation score */}
        <div
          className={`h-3 ${
            tutor.recommendationScore >= 0.8
              ? "bg-gradient-to-r from-indigo-600 to-purple-600"
              : tutor.recommendationScore >= 0.6
              ? "bg-gradient-to-r from-blue-500 to-indigo-600"
              : "bg-gradient-to-r from-blue-400 to-indigo-500"
          }`}
        ></div>

        <div className="p-5">
          {/* Tutor Header with Image and Basic Info */}
          <div className="flex items-center mb-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mr-4 border-2 border-indigo-100">
              {tutor.image ? (
                <img
                  src={tutor.image || "/placeholder.svg"}
                  alt={tutor.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-blue-500">
                  {tutor.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800">
                {tutor.username}
              </h3>
              <div className="flex items-center">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium ml-1">{tutor.rating}</span>
                </div>
                <span className="text-gray-500 text-sm ml-2">
                  ({tutor.bookingsCount || 0} sessions)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(tutor.id);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Recommendation Score Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">
                Match Score
              </span>
              <span className="text-xs font-semibold text-indigo-600">
                {Math.round(tutor.recommendationScore * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                style={{
                  width: `${Math.round(tutor.recommendationScore * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Recommendation Reasons */}
          {tutor.recommendationReasons &&
            tutor.recommendationReasons.length > 0 && (
              <div className="mb-4 bg-green-50 p-3 rounded-md">
                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                  <ThumbsUp className="w-4 h-4 mr-1 text-green-700" />
                  Why We Recommend This Tutor:
                </h4>
                <ul className="space-y-1">
                  {tutor.recommendationReasons.map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-green-800">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Tutor Subjects */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center">
              <BookOpen className="w-4 h-4 mr-1 text-indigo-500" />
              Subjects
            </h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {Array.isArray(tutor.subjects)
                ? tutor.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                    >
                      {subject.trim()}
                    </span>
                  ))
                : typeof tutor.subjects === "string"
                ? tutor.subjects.split(",").map((subject, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                    >
                      {subject.trim()}
                    </span>
                  ))
                : null}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  tutor.teachingLocation === "online"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {tutor.teachingLocation === "online" ? "Online" : "In-Person"}
              </span>
            </div>

            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
              onClick={() => {
                navigateToProfile(tutor.id);
              }}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TutorCardSkeleton = () => (
    <div className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
      <div className="h-64 bg-gray-200"></div>
      <div className="p-6">
        <div className="flex flex-col items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-4 bg-gray-200 rounded ${
                i === 4 ? "col-span-2" : ""
              }`}
            ></div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  const RecommendedTutorCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-3 bg-gray-200"></div>
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 mr-4"></div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="h-24 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Recommended Tutors Section - Only show if token exists and we have recommendations */}
        {token && recommendedTutors.length > 0 && (
          <div className="mb-12 relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Recommended For You
                </h2>
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                <ThumbsUp className="w-4 h-4 mr-1 text-indigo-500" />
                Personalized matches based on your preferences
              </div>
            </div>

            {loadingRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <RecommendedTutorCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedTutors.slice(0, 3).map((tutor) => (
                  <RecommendedTutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            )}

            {recommendedTutors.length > 3 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => navigate("/recommendations")}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center transition-colors"
                >
                  View all recommendations
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-4">
              Find Your Perfect Tutor
            </h1>
            <p className="text-indigo-100 text-center mb-8 max-w-2xl mx-auto text-lg">
              Connect with experienced and verified tutors for personalized
              learning experiences tailored to your needs
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or keywords..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400/30 text-gray-700"
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters({ ...filters, searchQuery: e.target.value })
                  }
                />
                {filters.searchQuery && (
                  <button
                    onClick={() => setFilters({ ...filters, searchQuery: "" })}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Filters Section */}
        <div
          className={`bg-white rounded-xl shadow-sm p-5 mb-5 ${
            token && recommendedTutors.length > 0 ? "" : "-mt-8"
          } relative z-10`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-gray-800">
              <Filter className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-lg">Filter Tutors</h2>
            </div>

            <div className="flex items-center gap-2">
              {Object.values(filters).some(
                (val) => val !== "" && val !== false
              ) && (
                <button
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? "rotate-90" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level
                </label>
                <select
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.grade}
                  onChange={(e) =>
                    setFilters({ ...filters, grade: e.target.value })
                  }
                >
                  <option value="">All Grades</option>
                  <option value="primary">Primary School</option>
                  <option value="middle">Middle School</option>
                  <option value="high">High School</option>
                  <option value="college">College/University</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teaching Location
                </label>
                <select
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.teachingLocation}
                  onChange={(e) =>
                    setFilters({ ...filters, teachingLocation: e.target.value })
                  }
                >
                  <option value="">All Locations</option>
                  <option value="online">Online</option>
                  <option value="physical">Physical</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience
                </label>
                <select
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.experience}
                  onChange={(e) =>
                    setFilters({ ...filters, experience: e.target.value })
                  }
                >
                  <option value="">Any Experience</option>
                  <option value="0-1">Less than 1 year</option>
                  <option value="1-2">1-2 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education
                </label>
                <select
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.education}
                  onChange={(e) =>
                    setFilters({ ...filters, education: e.target.value })
                  }
                >
                  <option value="">Any Education</option>
                  <option value="12_pass">12th Pass</option>
                  <option value="bachelor_ongoing">
                    Bachelor&apos;s (Ongoing)
                  </option>
                  <option value="bachelor_complete">
                    Bachelor&apos;s (Complete)
                  </option>
                  <option value="master_ongoing">
                    Master&apos;s (Ongoing)
                  </option>
                  <option value="master_complete">
                    Master&apos;s (Complete)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.rating}
                  onChange={(e) =>
                    setFilters({ ...filters, rating: e.target.value })
                  }
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="available"
                  type="checkbox"
                  checked={filters.isAvailable}
                  onChange={(e) =>
                    setFilters({ ...filters, isAvailable: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="available"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Available Now
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredTutors.length} Tutors Available
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">Sort by:</span>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`px-3 py-1.5 text-sm ${
                  activeSort === "rating"
                    ? "bg-indigo-600 text-white"
                    : "bg-white hover:bg-gray-50"
                } transition-colors`}
                onClick={() => setActiveSort("rating")}
              >
                Rating
              </button>
              <button
                className={`px-3 py-1.5 text-sm ${
                  activeSort === "experience"
                    ? "bg-indigo-600 text-white"
                    : "bg-white hover:bg-gray-50"
                } transition-colors`}
                onClick={() => setActiveSort("experience")}
              >
                Experience
              </button>
            </div>
          </div>
        </div>

        {/* Tutors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <TutorCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredTutors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTutors.map((tutor) => (
              <TutorCard key={tutor._id} tutor={tutor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No tutors found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              We couldn&apos;t find any tutors matching your criteria. Try
              adjusting your filters or search terms.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-indigo-50 py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Are You a Qualified Tutor?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Join our platform to connect with students looking for your
            expertise. Grow your tutoring business and make a difference in
            students&apos; lives.
          </p>
          <button
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
            onClick={() => navigate("/tutorSignup")}
          >
            Become a Tutor
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorListing;
