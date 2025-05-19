import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import baseUrl from "/src/config/config";
import TimeSlotBooking from "./UserTimeSlot";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  GraduationCap,
  Book,
  Briefcase,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Star,
  Users,
  Calendar,
  Award,
} from "lucide-react";

const TutorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchTutorDetails = async () => {
      try {
        setLoading(true);

        // Fetch tutor details
        const tutorResponse = await axios.get(
          `${baseUrl}/api/tutors/getTutorDetails/${id}`
        );

        // Fetch time slots
        const timeSlotsResponse = await axios.get(
          `${baseUrl}/api/timeslots/getAllTimeSlots/${id}`
        );

        // Fetch ratings
        const ratingsResponse = await axios.get(
          `${baseUrl}/api/ratings/getRatingsByTutorId/${id}`
        );

        if (tutorResponse.data.IsSuccess && tutorResponse.data.Result.tutor) {
          setTutor(tutorResponse.data.Result.tutor);
        }

        if (
          timeSlotsResponse.data.IsSuccess &&
          timeSlotsResponse.data.Result.timeSlots
        ) {
          setTimeSlots(timeSlotsResponse.data.Result.timeSlots);
        }

        if (
          ratingsResponse.data.IsSuccess &&
          ratingsResponse.data.Result.ratings
        ) {
          const ratingsData = ratingsResponse.data.Result.ratings;
          setRatings(ratingsData);

          // Calculate average rating
          if (ratingsData.length > 0) {
            const total = ratingsData.reduce(
              (sum, rating) => sum + rating.rating,
              0
            );
            setAverageRating((total / ratingsData.length).toFixed(1));
          }
        }
      } catch (error) {
        if (error.response && error.response.data) {
          const errorMessages = error.response.data.ErrorMessage.map(
            (err) => err.message
          ).join(", ");
          toast.error(errorMessages);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTutorDetails();
  }, [id]);

  const formatEducation = (education) => {
    return education
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSubjectsList = () => {
    if (!timeSlots || timeSlots.length === 0) return [];
    return [...new Set(timeSlots.map((slot) => slot.subjectName))];
  };

  const getExperienceText = (experience) => {
    switch (experience) {
      case "0-1":
        return "Less than 1 year";
      case "1-2":
        return "1-2 years";
      case "2-5":
        return "2-5 years";
      case "5+":
        return "More than 5 years";
      default:
        return experience;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading tutor profile...</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Tutor Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The tutor you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <button
            onClick={() => navigate("/tutors")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tutors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Banner Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-64 relative">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container mx-auto px-4 h-full flex items-end">
          <button
            onClick={() => navigate("/tutors")}
            className="absolute top-6 left-6 text-white flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tutors
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 -mt-32 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Profile Image & Basic Info */}
              <div className="relative">
                <div className="h-40 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <img
                      src={tutor.image || "/placeholder.svg"}
                      alt={tutor.username}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover"
                    />
                    {tutor.isVerified === "verified" && (
                      <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-20 pb-6 text-center">
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    {tutor.username}
                  </h1>
                  <p className="text-gray-600 flex items-center justify-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    {formatEducation(tutor.education)}
                  </p>

                  {/* Rating Badge */}
                  <div className="mt-3 flex justify-center">
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-yellow-700">
                        {averageRating}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({ratings.length} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="px-6 py-4 border-t border-b">
                <div className="flex flex-wrap gap-3">
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
                      tutor.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {tutor.isAvailable ? "Available Now" : "Unavailable"}
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

              {/* Contact Information */}
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Contact Information
                </h3>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {" "}
                    <Mail className="w-4 h-4 text-blue-500" />
                  </div>
                  <span>{tutor.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Phone className="w-4 h-4 text-blue-500" />
                  </div>
                  <span>{tutor.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  <span>{tutor.address}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">
                Teaching Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {ratings.length > 0 ? ratings.length : "New"}
                  </div>
                  <div className="text-sm text-gray-500">Students Taught</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {averageRating}
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {getSubjectsList().length}
                  </div>
                  <div className="text-sm text-gray-500">Subjects</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {getExperienceText(tutor.teachingExperience)}
                  </div>
                  <div className="text-sm text-gray-500">Experience</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl relative shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                About Me
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {tutor.description}
              </p>
            </div>

            {/* Teaching Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Book className="w-5 h-5 text-blue-500" />
                </div>
                Teaching Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <Book className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Grade Level</h3>
                    <p className="text-gray-600 capitalize">{tutor.grade}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <Briefcase className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Experience</h3>
                    <p className="text-gray-600">
                      {getExperienceText(tutor.teachingExperience)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Teaching Mode</h3>
                    <p className="text-gray-600 capitalize">
                      {tutor.teachingLocation}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Education</h3>
                    <p className="text-gray-600">
                      {formatEducation(tutor.education)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subjects */}
              {getSubjectsList().length > 0 && (
                <div className="mt-8">
                  <h3 className="font-medium text-gray-800 mb-3">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {getSubjectsList().map((subject) => (
                      <span
                        key={subject}
                        className="px-4 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 
                          text-blue-600 rounded-full text-sm font-medium
                          border border-blue-200"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Time Slot Booking Section */}
            <TimeSlotBooking
              tutorId={id}
              timeSlots={timeSlots}
              isAvailable={tutor.isAvailable}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDetails;
