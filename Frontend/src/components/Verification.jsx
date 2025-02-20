/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import baseUrl from "../config/config.js";
import { useLoading } from "../config/LoadingContext";

const Verification = () => {
  const { setLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [verificationCode, setVerificationCode] = useState("");
  const [resendTimer, setResendTimer] = useState(() => {
    // Initialize timer from localStorage or default to 60
    const savedTimer = localStorage.getItem("resendTimer");
    const savedTimestamp = localStorage.getItem("resendTimestamp");

    if (savedTimer && savedTimestamp) {
      const elapsed = Math.floor(
        (Date.now() - parseInt(savedTimestamp)) / 1000
      );
      const remainingTime = Math.max(0, parseInt(savedTimer) - elapsed);
      return remainingTime;
    }
    return 60;
  });
  const [canResend, setCanResend] = useState(() => {
    const savedTimer = localStorage.getItem("resendTimer");
    const savedTimestamp = localStorage.getItem("resendTimestamp");

    if (savedTimer && savedTimestamp) {
      const elapsed = Math.floor(
        (Date.now() - parseInt(savedTimestamp)) / 1000
      );
      return elapsed >= parseInt(savedTimer);
    }
    return false;
  });

  useEffect(() => {
    // Redirect if email is not available
    if (!email) {
      navigate("/login");
      return;
    }

    let interval;
    if (resendTimer > 0 && !canResend) {
      // Save timer state to localStorage
      localStorage.setItem("resendTimer", resendTimer.toString());
      localStorage.setItem("resendTimestamp", Date.now().toString());

      interval = setInterval(() => {
        setResendTimer((prev) => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            setCanResend(true);
            // Clear localStorage when timer reaches 0
            localStorage.removeItem("resendTimer");
            localStorage.removeItem("resendTimestamp");
          }
          return newValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [canResend, resendTimer, email, navigate]);

  const handleResendCode = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await axios.post(`${baseUrl}/api/users/resendCode`, {
        email,
      });
      if (response.data.IsSuccess) {
        toast.success("New verification code sent to your email!");
        setCanResend(false);
        setResendTimer(60);
        // Reset localStorage timer
        localStorage.setItem("resendTimer", "60");
        localStorage.setItem("resendTimestamp", Date.now().toString());
      } else {
        toast.error("Failed to resend code. Please try again.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.ErrorMessage[0]?.message ||
          "Error resending code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await axios.post(`${baseUrl}/api/users/verifyEmail`, {
        email,
        verificationCode,
      });

      if (response.data.IsSuccess) {
        toast.success(response.data.Result.message);
        const { accessToken } = response.data.Result;
        localStorage.setItem("accessToken", accessToken);
        // Clear resend timer data on successful verification
        localStorage.removeItem("resendTimer");
        localStorage.removeItem("resendTimestamp");
        navigate("/home");
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (error) {
      if (
        error.response?.data?.ErrorMessage[0]?.message ===
        "Email is already verified."
      ) {
        toast.success("Email is already verified");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        navigate("/login");
      } else {
        toast.error(
          error.response?.data?.ErrorMessage[0]?.message ||
            "Error verifying email."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same
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
                Verify Your Email
              </h2>
              <p className="text-gray-600 mt-2">
                Almost there! Just one more step
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleVerifyCode}>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  We've sent a verification code to {email}. Please check your
                  inbox and enter the code below.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    pattern="\d{6}"
                    name="verificationCode"
                    placeholder="000000"
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 text-center tracking-widest text-lg border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className={`text-sm ${
                    canResend
                      ? "text-blue-600 hover:text-blue-800 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {!canResend
                    ? `Resend code in ${resendTimer}s`
                    : "Resend Code"}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70"
              >
                Verify Email
              </button>
            </form>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center mt-5 px-4 py-2 rounded-lg bg-blue-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-200 group"
          >
            <ArrowLeft className="h-4 w-5 mr-1 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="font-medium">Back</span>
          </button>
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
              <h3 className="text-3xl font-bold">One Step Away!</h3>
              <p className="text-m text-blue-100">
                Let's verify your email to get started with TutorEase.
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

export default Verification;
