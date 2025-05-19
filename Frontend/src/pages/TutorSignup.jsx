/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import axios from "axios";
import baseUrl from "./../config/config";
import { useLoading } from "../config/LoadingContext";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  Mail,
  Lock,
  Book,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  Camera,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const TutorSignup = () => {
  const { setLoading } = useLoading();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("signupStep");
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  const [formData, setFormData] = useState(() => {
    const savedFormData = localStorage.getItem("signupFormData");
    const initialFormData = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: "",
      gender: "",
      grade: "",
      phoneNumber: "",
      address: "",
      education: "",
      teachingExperience: "",
      description: "",
      teachingLocation: "",
      image: null,
      certificateImage: null,
    };
    return savedFormData
      ? { ...initialFormData, ...JSON.parse(savedFormData) }
      : initialFormData;
  });

  useEffect(() => {
    // eslint-disable-next-line no-unused-vars
    const { image, certificateImage, ...dataToSave } = formData;
    localStorage.setItem("signupFormData", JSON.stringify(dataToSave));
    localStorage.setItem("signupStep", step);
  }, [formData, step]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePassword = (password) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\d\s]).{8,}$/.test(password);
  };

  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone.replace(/\D/g, ""));
  };

  const stepValidations = {
    1: () => {
      if (!formData.username.trim()) {
        toast.error("Username is required");
        return false;
      }
      if (formData.username.length < 3) {
        toast.error("Username must be at least 3 characters");
        return false;
      }
      if (!formData.email.trim()) {
        toast.error("Email is required");
        return false;
      }
      if (!validateEmail(formData.email)) {
        toast.error("Please enter a valid email");
        return false;
      }
      if (!formData.password) {
        toast.error("Password is required");
        return false;
      }
      if (!validatePassword(formData.password)) {
        toast.error(
          "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one symbol"
        );
        return false;
      }
      if (!formData.confirmPassword) {
        toast.error("Please confirm your password");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return false;
      }
      return true;
    },
    2: () => {
      if (!formData.age) {
        toast.error("Age is required");
        return false;
      }
      if (formData.age < 18) {
        toast.error("Age must be at least 18 to become a tutor");
        return false;
      }
      if (!formData.gender) {
        toast.error("Please select your gender");
        return false;
      }
      if (!formData.grade.trim()) {
        toast.error("Grade/Subject is required");
        return false;
      }
      if (!formData.phoneNumber.trim()) {
        toast.error("Phone number is required");
        return false;
      }
      if (!validatePhone(formData.phoneNumber)) {
        toast.error("Please enter a valid 10-digit phone number");
        return false;
      }
      if (!formData.address.trim()) {
        toast.error("Address is required");
        return false;
      }
      return true;
    },
    3: () => {
      if (!formData.education.trim()) {
        toast.error("Education qualification is required");
        return false;
      }
      if (!formData.teachingExperience.trim()) {
        toast.error("Teaching experience is required");
        return false;
      }
      if (!formData.description.trim()) {
        toast.error("Description is required");
        return false;
      }
      if (formData.description.length < 20) {
        toast.error(
          "Please provide a more detailed description (min 20 characters)"
        );
        return false;
      }
      if (!formData.teachingLocation) {
        toast.error("Please select teaching mode");
        return false;
      }
      return true;
    },
    4: () => {
      if (!formData.image) {
        toast.error("Profile photo is required");
        return false;
      }
      if (!formData.certificateImage) {
        toast.error("Certificate is required");
        return false;
      }
      return true;
    },
  };

  const nextStep = () => {
    const isValid = stepValidations[step] && stepValidations[step]();
    if (isValid) {
      setStep((prev) => {
        toast.success(`Step ${prev} completed successfully!`);
        return prev + 1;
      });
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!stepValidations[4]()) {
      toast.error("Validation failed, please check your form and try again.");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });
      const response = await axios.post(
        `${baseUrl}/api/tutors/registerTutor`,
        formDataToSend
      );

      const data = response.data;

      if (data.IsSuccess) {
        toast.success("Verify Your Email to Continue!");
        navigate("/verify", { state: { email: formData.email } });
        localStorage.removeItem("signupFormData");
        localStorage.removeItem("signupStep");
      } else {
        toast.error(`Failed to submit: ${data.ErrorMessage[0].message}`);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessages = error.response.data.ErrorMessage[0].message;
        toast.error(errorMessages);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800">Basic Information</h2>
        <p className="text-gray-600 mt-2">
          Let's start with your account details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <UserCircle
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800">Personal Details</h2>
        <p className="text-gray-600 mt-2">Tell us more about yourself</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label
            htmlFor="age"
            className="block text-sm font-medium text-gray-700"
          >
            Age
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="age"
            type="number"
            name="age"
            min={18}
            placeholder="Enter your age"
            value={formData.age}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700"
          >
            Gender
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="grade"
            className="block text-sm font-medium text-gray-700"
          >
            Grade Level
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Book className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Grade Level</option>
              <option value="elementary">Elementary (1-5)</option>
              <option value="middle">Middle School (6-8)</option>
              <option value="high">High School (9-12)</option>
              <option value="college">College Level</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="subjects"
            className="block text-sm font-medium text-gray-700"
          >
            Subjects
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Book className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <select
              id="subjects"
              name="subjects"
              value={formData.subjects}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="mathematics">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
              <option value="english">English</option>
              <option value="history">History</option>
              <option value="geography">Geography</option>
              <option value="computer_science">Computer Science</option>
              <option value="art">Art</option>
              <option value="music">Music</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Phone
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
            <input
              id="phoneNumber"
              type="tel"
              name="phoneNumber"
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
            <input
              id="address"
              type="text"
              name="address"
              placeholder="Enter your full address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800">
          Professional Information
        </h2>
        <p className="text-gray-600 mt-2">Share your teaching experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label
            htmlFor="education"
            className="block text-sm font-medium text-gray-700"
          >
            Education Qualification
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <GraduationCap
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
            <select
              id="education"
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Select Education Level</option>
              <option value="10_pass">10th Pass (SEE)</option>
              <option value="12_pass">+2/Higher Secondary</option>
              <option value="bachelor_running">Bachelor's Running</option>
              <option value="bachelor_complete">Bachelor's Degree</option>
              <option value="master_running">Master's Running</option>
              <option value="master_complete">Master's Degree</option>
              <option value="mphil">M.Phil</option>
              <option value="phd">PhD</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="teachingExperience"
            className="block text-sm font-medium text-gray-700"
          >
            Teaching Experience
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Briefcase
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
            <select
              id="teachingExperience"
              name="teachingExperience"
              value={formData.teachingExperience}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            About You
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <FileText
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
            <textarea
              id="description"
              name="description"
              placeholder="Tell us about yourself, your teaching methods, and what makes you unique as a teacher..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Minimum 20 characters required
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="teachingLocation"
            className="block text-sm font-medium text-gray-700"
          >
            Teaching Mode
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="teachingLocation"
            name="teachingLocation"
            value={formData.teachingLocation}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Teaching Mode</option>
            <option value="online">Online Only</option>
            <option value="physical">In-Person Only</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const getFilePreview = (file) => {
      if (!file) return null;

      if (file.type.startsWith("image/")) {
        return URL.createObjectURL(file);
      }
      return null;
    };

    return (
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Verification</h2>
          <p className="text-gray-600 mt-2">Upload required documents</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
            <Camera className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">Upload your profile photo</p>

            {formData.image && (
              <div className="mb-4">
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
                  <img
                    src={getFilePreview(formData.image)}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="profile-photo"
            />
            <label
              htmlFor="profile-photo"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl cursor-pointer hover:bg-blue-600 transition-colors"
            >
              {formData.image ? "Change Photo" : "Choose Photo"}
            </label>
            {formData.image && (
              <p className="mt-4 text-green-600 flex items-center justify-center">
                <CheckCircle size={20} className="mr-2" /> Photo selected
              </p>
            )}
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">
              Upload your Passed certificates
            </p>

            {formData.certificateImage &&
              formData.certificateImage.type.startsWith("image/") && (
                <div className="mb-4">
                  <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden">
                    <img
                      src={getFilePreview(formData.certificateImage)}
                      alt="Certificate preview"
                      className="w-full h-full object-contain bg-gray-50"
                    />
                  </div>
                </div>
              )}

            {formData.certificateImage &&
              !formData.certificateImage.type.startsWith("image/") && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <FileText className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-600">
                    {formData.certificateImage.name}
                  </p>
                </div>
              )}

            <input
              type="file"
              name="certificateImage"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="certificate"
            />
            <label
              htmlFor="certificate"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl cursor-pointer hover:bg-blue-600 transition-colors"
            >
              {formData.certificateImage
                ? "Change Certificate"
                : "Choose Certificate"}
            </label>
            {formData.certificateImage && (
              <p className="mt-4 text-green-600 flex items-center justify-center">
                <CheckCircle size={20} className="mr-2" /> Certificate selected
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Toaster />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Join TutorEase
          </h1>
          <p className="text-xl text-gray-600">
            Become a verified tutor and start teaching
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center max-w-3xl mx-auto relative">
            {/* Connection lines */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${((step - 1) / 3) * 100}%`,
                }}
              />
            </div>

            {["Basic Info", "Personal", "Professional", "Verification"].map(
              (label, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center z-10 bg-gradient-to-b from-white to-blue-50"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
            ${
              step >= idx + 1
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-sm text-gray-600 hidden md:block">
                    {label}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          <div className="flex justify-between mt-12">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="ml-auto px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="ml-auto px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorSignup;
