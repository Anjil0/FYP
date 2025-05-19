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
import VideoCall from "./components/VideoCall.jsx";
import CreateAssignment from "./components/CreateAssignment.jsx";
import AssignmentsDashboard from "./pages/Assignment.jsx";
import AssignmentDetailPage from "./components/SpecifiAssignment.jsx";
import EditAssignment from "./components/EditAssignment.jsx";
import StudentAssignmentPage from "./components/StudentAsignment.jsx";
import StdSpecificAssignment from "./components/StdSpecificAssignment.jsx";
import AnnouncementPage from "./pages/AdminAnnouncementPage.jsx";
import ReportGeneration from "./pages/ReportGeneration.jsx";
import RecommendedTutors from "./pages/RecommendedTutors.jsx";
import TutorProfile from "./pages/TutorProfile.jsx";
import TutorAnnouncementPage from "./pages/TutorAnnouncementPage.jsx";

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
            path="/Session"
            allowedRoles={["user", "Tutor"]}
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendation"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <RecommendedTutors />
              </ProtectedRoute>
            }
          />
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
            path="/stdAssignments"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <StudentAssignmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stdAssignment/:assignmentId"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <StdSpecificAssignment />
              </ProtectedRoute>
            }
          />
          {/* Tutor Routess  */}
          <Route
            path="/tutorProfile"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorProfile />
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
            path="/tutorAssignment"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <AssignmentsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments/create"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <CreateAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <EditAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments/:id"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <AssignmentDetailPage />
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
            path="/tutorAnnouncements"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorAnnouncementPage />
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
        {/* Admin routes */}
        <Route
          path="/adminDashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/generateReport"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportGeneration />
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
        <Route
          path="/announcements"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AnnouncementPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
