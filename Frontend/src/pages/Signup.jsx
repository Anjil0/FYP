/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { useLoading } from "../config/LoadingContext";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  GraduationCap,
  Upload,
  Eye,
  EyeOff,
  BookOpen,
  X,
  Plus,
} from "lucide-react";
import baseUrl from "../config/config.js";

const SignupPage = () => {
  const { setLoading } = useLoading();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [subjectInput, setSubjectInput] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    grade: "",
    phoneNumber: "",
    address: "",
    preferredSubjects: [],
    image: null,
  });

  // Common subjects for quick selection
  const commonSubjects = [
    "Mathematics", 
    "Physics", 
    "Chemistry", 
    "Biology", 
    "English", 
    "History", 
    "Computer Science"
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, image: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubjectInputChange = (e) => {
    setSubjectInput(e.target.value);
  };

  const addSubject = (subject = subjectInput) => {
    if (subject && !formData.preferredSubjects.includes(subject)) {
      setFormData({
        ...formData,
        preferredSubjects: [...formData.preferredSubjects, subject],
      });
      setSubjectInput("");
    }
  };

  const removeSubject = (subjectToRemove) => {
    setFormData({
      ...formData,
      preferredSubjects: formData.preferredSubjects.filter(
        (subject) => subject !== subjectToRemove
      ),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && subjectInput.trim()) {
      e.preventDefault();
      addSubject();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    
    // Append all form fields including the preferredSubjects array
    Object.keys(formData).forEach((key) => {
      if (key === "preferredSubjects") {
        // Handle array by appending each subject with the same key name
        formData[key].forEach((subject) => {
          formDataToSend.append("preferredSubjects", subject);
        });
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await axios.post(
        `${baseUrl}/api/users/register`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.data.IsSuccess) {
        toast.success("Verification code sent to your email.");
        navigate("/verify", { state: { email: formData.email } });
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessages = error.response.data.ErrorMessage[0].message;
        toast.error(`${errorMessages}`);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4.7rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-4 px-4">
      <div className="w-full max-w-7xl flex bg-white rounded-2xl shadow-xl overflow-hidden">
        <Toaster />

        {/* Left Section - Branding */}
        <div className="hidden lg:block w-[40%] bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white relative overflow-hidden">
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-700 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
              <img
                src="/LoginMain.png"
                alt="TutorEase"
                className="w-64 object-contain mb-4 relative transform hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="space-y-2 relative backdrop-blur-sm bg-white/5 p-6 rounded-xl">
              <h3 className="text-3xl font-bold">Welcome to TutorEase</h3>
              <p className="text-l text-blue-100">
                Simplifying Tutoring for Parents
              </p>
              <p className="text-blue-100 max-w-md mx-auto">
                Expert Tutors, Tailored for Your Child's Success
              </p>
            </div>
          </div>

          {/* Enhanced Decorative Elements */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-blue-700/20 rounded-full filter blur-3xl"></div>
        </div>

        {/* Right Section - Form */}
        <div className="w-full lg:w-[60%] p-8 lg:p-5 overflow-y-auto">
          <div className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent inline-flex items-center">
                <img src="/vite.svg" alt="Logo" className="h-8 w-8 mr-2" />
                TutorEase
              </h1>
              <h2 className="text-3xl font-semibold text-gray-800">
                Create Your Account
              </h2>
              <p className="text-gray-600">Join our community of learners</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Profile Image Upload with enhanced hover effect */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative h-24 w-24 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse group-hover:animate-none transition-all duration-300"></div>
                  <div className="absolute inset-0.5 bg-white rounded-full overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <User size={40} />
                      </div>
                    )}
                    <label className="absolute inset-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload size={20} />
                      <input
                        type="file"
                        name="image"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  Upload profile photo
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="username"
                        placeholder="Enter full name"
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none hover:border-blue-300"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none hover:border-blue-300"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create password"
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none hover:border-blue-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="Enter phone"
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none hover:border-blue-300"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade Level
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <select
                        name="grade"
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none appearance-none bg-white"
                        required
                      >
                        <option value="">Select Grade</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={`Class ${i + 1}`}>
                            Class {i + 1}
                          </option>
                        ))}
                        <option value="Higher Secondary">
                          Higher Secondary
                        </option>
                        <option value="Bachelors">Bachelors</option>
                        <option value="Masters">Masters</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        name="address"
                        placeholder="Enter address"
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none hover:border-blue-300"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Preferred Subjects Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Subjects
                  </label>
                  <div className="relative mb-2">
                    <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Add a subject you're interested in"
                      value={subjectInput}
                      onChange={handleSubjectInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none hover:border-blue-300"
                    />
                    <button
                      type="button"
                      onClick={() => addSubject()}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 focus:outline-none"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Quick select subjects */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {commonSubjects.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => addSubject(subject)}
                        className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        {subject}
                      </button>
                    ))}
                  </div>

                  {/* Display selected subjects */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferredSubjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                      >
                        <span className="text-sm">{subject}</span>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject)}
                          className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Create Account
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;