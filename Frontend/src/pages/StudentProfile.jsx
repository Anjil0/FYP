import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Shield,
  Calendar,
  X,
  Pencil,
  Camera,
  User,
  Save,
  CheckCircle,
  Book,
  Plus,
} from "lucide-react";
import { useLoading } from "../config/LoadingContext.jsx";
import { useProfileStore } from "../store.js";

const StudentProfile = () => {
  const { setLoading } = useLoading();
  const {
    user,
    isEditing,
    editedUser,
    fetchUserDetails,
    updateUserDetails,
    setEditedUser,
    toggleEditing,
  } = useProfileStore();

  const [imagePreview, setImagePreview] = useState(null);
  const [newSubject, setNewSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Common subjects for dropdown
  const commonSubjects = [
    "Mathematics",
    "English",
    "Science",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Computer Science",
    "Economics",
    "Business Studies",
    "Nepali",
    "Art",
    "Music",
    "Add Custom...",
  ];

  useEffect(() => {
    if (!fetchUserDetails) {
      console.error("fetchUserDetails function is not available");
      return;
    }
    fetchUserDetails(setLoading);
  }, [fetchUserDetails, setLoading]);

  useEffect(() => {
    if (!isEditing) {
      setImagePreview(null);
      setNewSubject("");
      setCustomSubject("");
      setShowCustomInput(false);
    }
  }, [isEditing]);

  useEffect(() => {
    if (
      user &&
      (!editedUser.preferredSubjects ||
        !Array.isArray(editedUser.preferredSubjects))
    ) {
      setEditedUser("preferredSubjects", user.preferredSubjects || []);
    }
  }, [user, editedUser]);

  useEffect(() => {
    if (newSubject === "Add Custom...") {
      setShowCustomInput(true);
      setNewSubject("");
    }
  }, [newSubject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateUserDetails(setLoading);
  };

  const handleInputChange = (field) => (e) => {
    setEditedUser(field, e.target.value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setEditedUser("image", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSubject = () => {
    if (newSubject && !editedUser.preferredSubjects.includes(newSubject)) {
      const updatedSubjects = [...editedUser.preferredSubjects, newSubject];
      setEditedUser("preferredSubjects", updatedSubjects);
      setNewSubject("");
    }
  };

  const addCustomSubject = () => {
    if (
      customSubject &&
      !editedUser.preferredSubjects.includes(customSubject)
    ) {
      const updatedSubjects = [...editedUser.preferredSubjects, customSubject];
      setEditedUser("preferredSubjects", updatedSubjects);
      setCustomSubject("");
      setShowCustomInput(false);
    }
  };

  const removeSubject = (subjectToRemove) => {
    const updatedSubjects = editedUser.preferredSubjects.filter(
      (subject) => subject !== subjectToRemove
    );
    setEditedUser("preferredSubjects", updatedSubjects);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleString("default", {
      month: "long",
    })} ${date.getDate()}, ${date.getFullYear()}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-indigo-50">
        <div className="animate-pulse flex flex-col items-center bg-white p-8 rounded-xl shadow-lg">
          <div className="h-28 w-28 bg-gray-200 rounded-full mb-6"></div>
          <div className="h-8 w-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded-lg mb-3"></div>
          <div className="h-4 w-56 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 gap-4 mt-8 w-full">
            <div className="h-16 bg-gray-100 rounded-xl"></div>
            <div className="h-16 bg-gray-100 rounded-xl"></div>
            <div className="h-16 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const subjectBadges = (
    isEditing ? editedUser.preferredSubjects : user.preferredSubjects
  )?.map((subject, index) => (
    <div
      key={index}
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2 mb-2"
    >
      <Book size={12} className="mr-1" />
      {subject}
      {isEditing && (
        <button
          type="button"
          onClick={() => removeSubject(subject)}
          className="ml-1 text-indigo-500 hover:text-red-500"
        >
          <X size={12} />
        </button>
      )}
    </div>
  ));

  return (
    <div className="min-h-screen bg-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Header Section */}
          <div className="bg-violet-600 h-48 relative">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-12 left-12 w-6 h-6 rounded-full bg-white"></div>
              <div className="absolute top-24 left-40 w-4 h-4 rounded-full bg-white"></div>
              <div className="absolute top-10 right-20 w-5 h-5 rounded-full bg-white"></div>
              <div className="absolute bottom-10 right-40 w-3 h-3 rounded-full bg-white"></div>
              <div className="absolute bottom-15 left-60 w-2 h-2 rounded-full bg-white"></div>
            </div>

            {/* Edit/Save Buttons */}
            {!isEditing ? (
              <button
                onClick={() => toggleEditing()}
                className="absolute top-4 right-4 bg-white text-violet-600 p-3 rounded-full shadow-md hover:bg-violet-50 transition-all duration-200 z-10"
                aria-label="Edit profile"
              >
                <Pencil size={20} />
              </button>
            ) : (
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-white text-green-600 p-3 rounded-full shadow-md hover:bg-green-50 transition-all duration-200 z-10"
                >
                  <Save size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleEditing()}
                  className="bg-white text-red-600 p-3 rounded-full shadow-md hover:bg-red-50 transition-all duration-200 z-10"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Profile Image */}
            <div className="absolute -bottom-20 left-8 md:left-10">
              <div className="relative h-40 w-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                {imagePreview || user.image ? (
                  <img
                    src={imagePreview || user.image}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-indigo-100">
                    <User size={48} className="text-indigo-300" />
                  </div>
                )}

                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer transition-all duration-200 hover:bg-opacity-60">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Camera size={24} className="text-white" />
                  </label>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="pt-24 px-8 pb-8">
              {/* User Info */}
              <div className="mb-8">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.username || ""}
                    onChange={handleInputChange("username")}
                    className="text-3xl font-bold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 w-full mb-3 focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                    placeholder="Your Name"
                    required
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {user.username}
                  </h1>
                )}

                <div className="flex flex-wrap items-center mt-3 text-sm text-indigo-600">
                  <div className="flex items-center mr-4 mb-2">
                    <Shield size={16} className="mr-1" />
                    <span className="font-medium">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center mr-4 mb-2">
                    <Calendar size={16} className="mr-1" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>

                  {user.isEmailVerified && (
                    <div className="flex items-center text-green-500 mb-2">
                      <CheckCircle size={16} className="mr-1" />
                      <span>Email Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* All profile content without tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Email Field */}
                  <div className="bg-indigo-50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-indigo-700">
                        <Mail className="w-5 h-5" />
                        <h3 className="font-medium ml-3">Email Address</h3>
                      </div>
                      <span className="text-xs bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full">
                        Cannot Edit
                      </span>
                    </div>
                    <p className="mt-3 text-gray-700">{user.email}</p>
                  </div>

                  {/* Phone Field */}
                  <div className="bg-indigo-50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center text-indigo-700">
                      <Phone className="w-5 h-5" />
                      <h3 className="font-medium ml-3">Phone Number</h3>
                    </div>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedUser.phoneNumber || ""}
                        onChange={handleInputChange("phoneNumber")}
                        className="mt-3 bg-white border border-indigo-200 rounded-lg px-4 py-3 w-full focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                        placeholder="Your phone number"
                        required
                      />
                    ) : (
                      <p className="mt-3 text-gray-700">
                        {user.phoneNumber || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Address Field */}
                  <div className="bg-indigo-50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center text-indigo-700">
                      <MapPin className="w-5 h-5" />
                      <h3 className="font-medium ml-3">Address</h3>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.address || ""}
                        onChange={handleInputChange("address")}
                        className="mt-3 bg-white border border-indigo-200 rounded-lg px-4 py-3 w-full focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                        placeholder="Your address"
                        required
                      />
                    ) : (
                      <p className="mt-3 text-gray-700">
                        {user.address || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Grade/Education Level Field */}
                  <div className="bg-indigo-50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center text-indigo-700">
                      <GraduationCap className="w-5 h-5" />
                      <h3 className="font-medium ml-3">Education Level</h3>
                    </div>
                    {isEditing ? (
                      <select
                        value={editedUser.grade || ""}
                        onChange={handleInputChange("grade")}
                        className="mt-3 bg-white border border-indigo-200 rounded-lg px-4 py-3 w-full focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                        required
                      >
                        <option value="">Select Education Level</option>
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Bachelor">Bachelor's Degree</option>
                        <option value="Masters">Master's Degree</option>
                        <option value="PhD">PhD</option>
                      </select>
                    ) : (
                      <p className="mt-3 text-gray-700">
                        {user.grade || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Preferred Subjects */}
                  <div className="bg-indigo-50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center text-indigo-700 mb-4">
                      <Book className="w-5 h-5" />
                      <h3 className="font-medium ml-3">Preferred Subjects</h3>
                    </div>

                    <div className="flex flex-wrap">{subjectBadges}</div>

                    {isEditing && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-100">
                        {!showCustomInput ? (
                          <div className="flex space-x-2 mb-2">
                            <select
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                              className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none text-sm"
                            >
                              <option value="">Select a subject</option>
                              {commonSubjects
                                .filter(
                                  (subject) =>
                                    !editedUser.preferredSubjects?.includes(
                                      subject
                                    ) || subject === "Add Custom..."
                                )
                                .map((subject, index) => (
                                  <option key={index} value={subject}>
                                    {subject}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={addSubject}
                              disabled={!newSubject}
                              className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-300 flex items-center"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2 mb-2">
                            <input
                              type="text"
                              value={customSubject}
                              onChange={(e) => setCustomSubject(e.target.value)}
                              placeholder="Enter subject name"
                              className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none text-sm"
                            />
                            <button
                              type="button"
                              onClick={addCustomSubject}
                              disabled={!customSubject}
                              className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-300 flex items-center"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCustomInput(false)}
                              className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        {editedUser.preferredSubjects?.length === 0 && (
                          <p className="text-xs text-red-500">
                            At least one preferred subject is required
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
