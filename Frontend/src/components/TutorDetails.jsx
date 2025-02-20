// TutorDetails.jsx
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
  MessageCircle,
  Users,
} from "lucide-react";

const TutorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/tutors/getTutorDetails/${id}`
        );
        if (response.data.IsSuccess && response.data.Result.tutor) {
          setTutor(response.data.Result.tutor);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Tutor Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            The tutor you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <button
            onClick={() => navigate("/tutors")}
            className="text-blue-500 hover:text-blue-600 flex items-center gap-2 mx-auto"
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-48">
        <div className="container mx-auto px-4 absolute">
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
      <div className="container mx-auto px-4 -mt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Profile Image & Basic Info */}
              <div className="relative">
                <img
                  src={tutor.image}
                  alt={tutor.username}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {tutor.username}
                  </h1>
                  <p className="text-white/90 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    {formatEducation(tutor.education)}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="p-6 border-b">
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
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span>{tutor.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <span>{tutor.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span>{tutor.address}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">150+</div>
                    <div className="text-sm text-gray-500">Students Taught</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">4.8</div>
                    <div className="text-sm text-gray-500">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                About Me
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {tutor.description}
              </p>
            </div>

            {/* Teaching Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Teaching Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Book className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Grade Level</h3>
                    <p className="text-gray-600 capitalize">{tutor.grade}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Briefcase className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Experience</h3>
                    <p className="text-gray-600">
                      {tutor.teachingExperience} Years
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Teaching Mode</h3>
                    <p className="text-gray-600 capitalize">
                      {tutor.teachingLocation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slot Booking Section */}
            <TimeSlotBooking tutorId={id} />

            {/* Action Button */}
            <div className="flex gap-4">
              <button className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg">
                <MessageCircle className="w-5 h-5" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDetails;
