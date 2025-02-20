import { useEffect } from "react";
import { Toaster } from "sonner";
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Shield,
  Calendar,
  X,
  Pencil,
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

  useEffect(() => {
    if (!fetchUserDetails) {
      console.error("fetchUserDetails function is not available");
    }
    fetchUserDetails(setLoading);
  }, [fetchUserDetails, setLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateUserDetails(setLoading);
  };

  const handleInputChange = (field) => (e) => {
    setEditedUser(field, e.target.value);
  };

  return (
    <div className="min-h-screen h-[calc(100vh-4.8rem)] bg-gray-50 p-4 sm:p-6 lg:p-8 relative">
      {user ? (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-lg">
          {/* Header */}
          <Toaster />
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6">
            <div className="flex items-center gap-6">
              <img
                src={user.image || "/api/placeholder/400/400"}
                alt={user.username}
                className="w-24 h-24 rounded-full bg-white"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold text-white mb-3">
                    {user.username}
                  </h1>
                  <button
                    onClick={toggleEditing}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
                <div className="flex gap-2">
                  {user.isEmailVerified && (
                    <span className="px-4 py-1 bg-green-400 text-white rounded-full text-sm">
                      Verified Account
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-blue-500 rounded-xl p-3">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-600 text-sm font-medium">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* Grade */}
              <div className="bg-violet-50 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-violet-500 rounded-xl p-3">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-violet-600 text-sm font-medium">Grade</p>
                  <p className="text-gray-900">{user.grade}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-purple-500 rounded-xl p-3">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-purple-600 text-sm font-medium">Phone</p>
                  <p className="text-gray-900">{user.phoneNumber}</p>
                </div>
              </div>

              {/* Address */}
              <div className="bg-teal-50 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-teal-500 rounded-xl p-3">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-teal-600 text-sm font-medium">Address</p>
                  <p className="text-gray-900">{user.address}</p>
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-pink-50 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-pink-500 rounded-xl p-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-pink-600 text-sm font-medium">
                    Member Since
                  </p>
                  <p className="text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-500 rounded-lg p-2">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Account Security
                      </h3>
                      <p className="text-sm text-gray-500">
                        Manage your account security settings
                      </p>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transform transition-all hover:scale-105 duration-300 shadow-lg">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full">
          <p>Loading user details, please wait...</p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Profile</h2>
              <button
                onClick={() => toggleEditing(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editedUser.username || ""}
                  onChange={handleInputChange("username")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editedUser.phoneNumber || ""}
                  onChange={handleInputChange("phoneNumber")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select
                      name="grade"
                      value={editedUser.grade || ""}
                      onChange={handleInputChange("grade")}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none appearance-none bg-white"
                      required
                    >
                      <option value="">Select Grade</option>
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={`Class ${i + 1}`}>
                          Class {i + 1}
                        </option>
                      ))}
                      <option value="Higher Secondary">Higher Secondary</option>
                      <option value="Bachelors">Bachelors</option>
                      <option value="Masters">Masters</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={editedUser.address || ""}
                  onChange={handleInputChange("address")}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => toggleEditing(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
