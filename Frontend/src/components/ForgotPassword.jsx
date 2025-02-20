/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import baseUrl from "../config/config.js";
import { useLoading } from "../config/LoadingContext";

const ForgotPassword = () => {
  const { setLoading } = useLoading();
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await axios.post(`${baseUrl}/api/users/forgotPassword`, {
        email,
      });
      if (response.data.IsSuccess) {
        toast.success("Password reset link sent to your email!");
        setIsEmailSent(true);
      } else {
        toast.error("Failed to send reset link. Please try again.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.ErrorMessage[0]?.message ||
          "Error sending reset link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4.8rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-6 px-4">
      <div className="w-full max-w-5xl h-auto flex bg-white rounded-2xl shadow-xl overflow-hidden">
        <Toaster />

        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-600 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                TutorEase
              </h1>
              <h2 className="text-3xl font-semibold text-gray-800 mt-4">
                Forgot Password?
              </h2>
              <p className="text-gray-600 mt-2">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isEmailSent ? (
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    Send Reset Link
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      We've sent a password reset link to {email}. Please check
                      your inbox and follow the instructions.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center mt-5 px-4 py-2 rounded-lg bg-blue-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-200 group"
          >
            <ArrowLeft className="h-4 w-5 mr-1 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="font-medium">Back to Login</span>
          </Link>
        </div>

        {/* Right Side - Welcome Section */}
        <div className="hidden lg:block w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white">
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <img
              src="/LoginMain.png"
              alt="Logo"
              className="w-64 object-contain mb-4 transform hover:scale-105 transition-transform duration-300"
            />
            <div className="space-y-1 relative">
              <h3 className="text-3xl font-bold">Reset your password</h3>
              <p className="text-m text-blue-100">
                Get back to learning with TutorEase in just a few steps.
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

export default ForgotPassword;
