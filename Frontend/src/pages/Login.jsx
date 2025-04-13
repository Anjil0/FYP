/* eslint-disable react/no-unescaped-entities */
import { useAuthStore } from "../store";
import { useLoading } from "../config/LoadingContext";
import { useNavigate, Link } from "react-router-dom";
import { Toaster } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const LoginPage = () => {
  const { setLoading } = useLoading();
  const navigate = useNavigate();
  const { isAuthenticated, loginUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    loginUser(formData, navigate, setLoading);
  };

  return (
    <div className="h-[calc(100vh-4.8rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-6 px-4">
      <div className="w-full max-w-5xl h-auto flex bg-white rounded-2xl shadow-xl overflow-hidden">
        <Toaster />

        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-600 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                TutorEase
              </h1>
              <h2 className="text-3xl font-semibold text-gray-800 mt-4">
                Welcome Back!
              </h2>
              <p className="text-gray-600 mt-2">Please login to your account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
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
              </div>

              <div className="text-right">
                <Link
                  to="/forgotPassword"
                  state={{ from: "/login" }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Login
              </button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign up Now
              </Link>
            </p>
          </div>
        </div>

        <div className="hidden lg:block w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white">
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <img
              src="/LoginMain.png"
              alt="Logo"
              className="w-64 object-contain mb-4 transform hover:scale-105 transition-transform duration-300"
            />
            <div className="space-y-4 relative">
              <h3 className="text-3xl font-bold">Welcome Back to TutorEase!</h3>
              <p className="text-lg text-blue-100">
                Let's continue your learning journey together.
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
