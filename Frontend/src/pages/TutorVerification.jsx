import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, MoreVertical } from "lucide-react";
import Sidebar from "../components/AdminSidebar";
import baseUrl from "/src/config/config";
import { useLoading } from "./../config/LoadingContext";
import { toast, Toaster } from "sonner";

const TutorVerification = () => {
  const { setLoading } = useLoading();
  const [tutors, setTutors] = useState([]);
  const [selectedSection, setSelectedSection] = useState("tutors");

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${baseUrl}/api/tutors/getAllTutors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.IsSuccess && response.data.Result.tutors) {
          setTutors(response.data.Result.tutors);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          const errorMessages = error.response.data.ErrorMessage.map(
            (err) => err.message
          ).join(", ");
          toast.error(`${errorMessages}`);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, [setLoading]);

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await axios.post(
        `${baseUrl}/api/tutors/verifyTutor/${id}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.IsSuccess) {
        setTutors(
          tutors.map((tutor) =>
            tutor._id === id ? { ...tutor, isVerified: action } : tutor
          )
        );
      }
    } catch (error) {
      console.error("Error performing action on tutor:", error);
      if (error.response && error.response.data) {
        const errorMessages = error.response.data.ErrorMessage.map(
          (err) => err.message
        ).join(", ");
        toast.error(`${errorMessages}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster />
      {/* Sidebar */}
      <Sidebar
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Tutor Verification</h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="overflow-x-auto">
            {tutors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <h3 className="text-xl font-semibold text-gray-600">
                  No Tutors Found
                </h3>
                <p className="text-gray-500">
                  There are no tutors available for verification at the moment.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Name</th>
                    <th className="text-left py-4 px-4">Subject</th>
                    <th className="text-left py-4 px-4">Teaching Type</th>
                    <th className="text-left py-4 px-4">Certificate</th>
                    <th className="text-left py-4 px-4">Status</th>
                    <th className="text-left py-4 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((tutor) => (
                    <tr key={tutor._id} className="border-b last:border-0">
                      <td className="py-4 px-4">{tutor.username}</td>
                      <td className="py-4 px-4">{tutor.subject || "N/A"}</td>
                      <td className="py-4 px-4">{tutor.teachingLocation}</td>
                      <td className="py-4 px-4">
                        <img
                          src={tutor.certificateImage}
                          alt={`${tutor.username}'s certificate`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-sm
                            ${
                              tutor.isVerified === "verified"
                                ? "bg-green-100 text-green-600"
                                : tutor.isVerified === "rejected"
                                ? "bg-red-100 text-red-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                        >
                          {tutor.isVerified === "verified"
                            ? "Verified"
                            : tutor.isVerified === "rejected"
                            ? "Rejected"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {tutor.isVerified === "pending" && (
                          <div className="flex gap-2">
                            <button
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                              onClick={() =>
                                handleAction(tutor._id, "verified")
                              }
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                              onClick={() =>
                                handleAction(tutor._id, "rejected")
                              }
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorVerification;
