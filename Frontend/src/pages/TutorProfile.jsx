/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import baseUrl from "/src/config/config";
import { useLoading } from "../config/LoadingContext";
import {
  User,
  Mail,
  CheckCircle,
  Phone,
  Book,
  Briefcase,
  MapPin,
  GraduationCap,
  BookOpen,
  Clock,
  Check,
  X,
  Edit2,
  Save,
  Upload,
  FileText,
} from "lucide-react";

const TutorProfile = () => {
  const { setLoading } = useLoading();
  const [tutorData, setTutorData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch tutor profile data
  useEffect(() => {
    const fetchTutorProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseUrl}/api/tutors/getTutorProfile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.IsSuccess) {
          setTutorData(response.data.Result.tutor);
          setEditedProfile(response.data.Result.tutor);
        }
      } catch (error) {
        toast.error("Failed to load profile data");
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorProfile();
  }, [setLoading, token]);

  // Phone number validation
  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone.replace(/\D/g, ""));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile changes
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !editedProfile.username ||
      !editedProfile.phoneNumber ||
      !editedProfile.address ||
      !editedProfile.grade
    ) {
      toast.error("All fields are required");
      return;
    }

    // Validate phone number
    if (!validatePhone(editedProfile.phoneNumber)) {
      toast.error("Invalid phone number format. Must be 10 digits.");
      return;
    }

    try {
      setLoading(true);

      // Create form data if there's an image file
      const formData = new FormData();

      // Add all fields except teachingLocation
      const fieldsToUpdate = [
        "username",
        "age",
        "gender",
        "grade",
        "phoneNumber",
        "address",
        "education",
        "teachingExperience",
        "description",
      ];

      fieldsToUpdate.forEach((key) => {
        if (editedProfile[key] !== undefined) {
          formData.append(key, editedProfile[key]);
        }
      });

      // Keep the original teaching location
      if (tutorData.teachingLocation) {
        formData.append("teachingLocation", tutorData.teachingLocation);
      }

      // Add profile image if selected
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await axios.put(
        `${baseUrl}/api/tutors/updateTutor`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.IsSuccess) {
        setTutorData(response.data.Result.tutor);
        setIsEditing(false);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!tutorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster richColors />
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600 mt-1">
                Manage your personal information and settings
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3 mt-4 md:mt-0">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile(tutorData);
                    setImagePreview(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-blue-50 flex items-center justify-center">
                      {isEditing ? (
                        <>
                          {imagePreview || tutorData.image ? (
                            <img
                              src={imagePreview || tutorData.image}
                              alt={tutorData.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl font-bold text-blue-500">
                              {tutorData.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {tutorData.image ? (
                            <img
                              src={tutorData.image}
                              alt={tutorData.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl font-bold text-blue-500">
                              {tutorData.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {isEditing && (
                      <label
                        htmlFor="profileImage"
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition"
                      >
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          id="profileImage"
                          name="profileImage"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-gray-800">
                    {tutorData.username}
                  </h2>
                  <p className="text-gray-500">{tutorData.email}</p>

                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        tutorData.isVerified === "verified"
                          ? "bg-green-100 text-green-700"
                          : tutorData.isVerified === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tutorData.isVerified === "verified"
                        ? "Verified Tutor"
                        : tutorData.isVerified === "pending"
                        ? "Verification Pending"
                        : "Not Verified"}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        tutorData.isAvailable
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tutorData.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-700">{tutorData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={editedProfile.phoneNumber || ""}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-700">
                          {tutorData.phoneNumber || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      {isEditing ? (
                        <textarea
                          name="address"
                          value={editedProfile.address || ""}
                          onChange={handleInputChange}
                          rows="2"
                          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-700">
                          {tutorData.address || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Teaching Preferences Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                  Teaching Preferences
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Teaching Location
                    </p>
                    <p className="text-gray-800 font-medium capitalize">
                      {tutorData.teachingLocation === "online"
                        ? "Online"
                        : "In-person"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 text-blue-500 mr-2" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={editedProfile.username || ""}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">
                        {tutorData.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Age
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="age"
                        value={editedProfile.age || ""}
                        onChange={handleInputChange}
                        min="18"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">
                        {tutorData.age} years
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={editedProfile.gender || ""}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="text-gray-800 font-medium capitalize">
                        {tutorData.gender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Current Grade/Level
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <Book
                          className="absolute left-4 top-3.5 text-gray-400"
                          size={20}
                        />
                        <select
                          name="grade"
                          value={editedProfile.grade || ""}
                          onChange={handleInputChange}
                          className="mt-1 block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Grade Level</option>
                          <option value="elementary">Elementary (1-5)</option>
                          <option value="middle">Middle School (6-8)</option>
                          <option value="high">High School (9-12)</option>
                          <option value="college">College Level</option>
                        </select>
                      </div>
                    ) : (
                      <p className="text-gray-800 font-medium">
                        {tutorData.grade}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Educational Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <GraduationCap className="w-5 h-5 text-blue-500 mr-2" />
                  Educational Background
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Education
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <GraduationCap
                          className="absolute left-4 top-3.5 text-gray-400"
                          size={20}
                        />
                        <select
                          name="education"
                          value={editedProfile.education || ""}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                          <option value="">Select Education Level</option>
                          <option value="10_pass">10th Pass (SEE)</option>
                          <option value="12_pass">+2/Higher Secondary</option>
                          <option value="bachelor_running">
                            Bachelor's Running
                          </option>
                          <option value="bachelor_complete">
                            Bachelor's Degree
                          </option>
                          <option value="master_running">
                            Master's Running
                          </option>
                          <option value="master_complete">
                            Master's Degree
                          </option>
                          <option value="mphil">M.Phil</option>
                          <option value="phd">PhD</option>
                        </select>
                      </div>
                    ) : (
                      <p className="text-gray-800">{tutorData.education}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Teaching Experience
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <Briefcase
                          className="absolute left-4 top-3.5 text-gray-400"
                          size={20}
                        />
                        <select
                          name="teachingExperience"
                          value={editedProfile.teachingExperience || ""}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                          <option value="">Select Experience</option>
                          <option value="fresher">Fresher</option>
                          <option value="0-1">Less than 1 year</option>
                          <option value="1-2">1-2 years</option>
                          <option value="2-5">2-5 years</option>
                          <option value="5-10">5-10 years</option>
                          <option value="10+">More than 10 years</option>
                        </select>
                      </div>
                    ) : (
                      <p className="text-gray-800">
                        {tutorData.teachingExperience}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description & Bio */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 text-blue-500 mr-2" />
                  Profile Description
                </h3>

                <div>
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={editedProfile.description || ""}
                      onChange={handleInputChange}
                      rows="5"
                      placeholder="Tell students about yourself, your teaching style, and what makes you unique as a tutor..."
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 whitespace-pre-line">
                      {tutorData.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Verification Documents */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                  Verification Status
                </h3>

                <div className="flex items-center p-4 bg-gray-50 rounded-lg mb-4">
                  <div
                    className={`p-2 rounded-full mr-4 ${
                      tutorData.isVerified === "verified"
                        ? "bg-green-100 text-green-700"
                        : tutorData.isVerified === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tutorData.isVerified === "verified" ? (
                      <Check className="w-6 h-6" />
                    ) : tutorData.isVerified === "pending" ? (
                      <Clock className="w-6 h-6" />
                    ) : (
                      <X className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800">
                      {tutorData.isVerified === "verified"
                        ? "Your profile is verified"
                        : tutorData.isVerified === "pending"
                        ? "Verification in progress"
                        : "Your profile needs verification"}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {tutorData.isVerified === "verified"
                        ? "You are fully verified and can accept students."
                        : tutorData.isVerified === "pending"
                        ? "We're reviewing your submitted documents. This usually takes 1-3 business days."
                        : "Please upload required verification documents to start tutoring."}
                    </p>
                  </div>
                </div>

                {isEditing && tutorData.isVerified !== "verified" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Certificate (PDF, JPG, PNG)
                    </label>
                    <input
                      type="file"
                      name="certificateImage"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Please upload a document that verifies your educational
                      qualifications or teaching certification.
                    </p>
                  </div>
                )}

                {!isEditing && tutorData.certificateImage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Uploaded Certificate
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <a
                        href={tutorData.certificateImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        View Certificate
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;
