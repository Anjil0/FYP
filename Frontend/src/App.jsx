import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupPage from "./pages/Signup";
import LoginPage from "./pages/Login.jsx";
import {
  ProtectedRoute,
  ForgotPasswordRoute,
  PublicRoute,
  RoleBasedRedirect,
} from "./authUtils/PrivateRoute.jsx";
import Layout from "./authUtils/Layout.jsx";
import LandingPage from "./pages/Landing.jsx";
import AboutUs from "./pages/About.jsx";
// import TutorProfile from "./pages/Profile.jsx";
import TutorBookingRequests from "./pages/TutorBookingReq.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Verification from "./components/verification.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import TutorSignup from "./pages/TutorSignup.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import TutorVerification from "./pages/TutorVerification.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import TutorListing from "./pages/TutorListing.jsx";
import TutorDetails from "./components/TutorDetails.jsx";
import TutorDashboard from "./pages/TutorDashboard.jsx";
import AllTimeSlots from "./components/AllTimeSlot.jsx";
import UserBookingsPage from "./pages/UserBookingPage.jsx";
import PaymentSuccess from "./components/PaymentSuccess.jsx";
import CancelPayment from "./components/CancelPayment.jsx";
import { useEffect } from "react";
import socket from "./socket";
import StudentMessagePage from "./pages/StudentMessage.jsx";
import TutorMessagePage from "./pages/TutorMessage.jsx";
import { isValidToken } from "./authUtils/authUtils.js";

const App = () => {
  const registerSocket = () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      if (!isValidToken(token)) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("expiresAt");
        localStorage.removeItem("role");
        window.location.reload();
      }
      const userId = JSON.parse(atob(token.split(".")[1])).sub;

      socket.emit("register", userId);

      return () => {
        socket.emit("unregister", userId);
      };
    }
  };

  useEffect(() => {
    registerSocket();
    socket.on("connect", registerSocket);

    return () => {
      socket.off("connect", registerSocket);
      socket.emit("unregister");
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes - accessible by everyone */}
          <Route
            path="/"
            element={
              <RoleBasedRedirect>
                <LandingPage />
              </RoleBasedRedirect>
            }
          />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/tutors" element={<TutorListing />} />
          <Route path="/tutorSignup" element={<TutorSignup />} />
          <Route path="/tutors/:id" element={<TutorDetails />} />

          {/* Auth routes - only accessible when logged out */}
          <Route
            path="/verify"
            element={
              <PublicRoute>
                <Verification />
              </PublicRoute>
            }
          />
          <Route
            path="/resetPass/:code"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected password routes */}
          <Route
            path="/forgotPassword"
            element={
              <ForgotPasswordRoute>
                <ForgotPassword />
              </ForgotPasswordRoute>
            }
          />

          {/* Auth routes - only accessible when logged in */}

          <Route
            path="/Stdprofile"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stdDashboard"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Mybookings"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UserBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-cancel"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <CancelPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stdChat"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <StudentMessagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutorBookingReq"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorBookingRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutorDashboard"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutorChat"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorMessagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutorTimeSlot"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <AllTimeSlots />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/adminDashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminUsers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutorVerification"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TutorVerification />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
