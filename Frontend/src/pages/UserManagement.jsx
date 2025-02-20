import { useState, useEffect } from "react";
import axios from "axios";
import { XCircle, MoreVertical } from "lucide-react";
import Sidebar from "../components/AdminSidebar";
import baseUrl from "/src/config/config";
import { useLoading } from "./../config/LoadingContext";
import { toast, Toaster } from "sonner";

const UserManagement = () => {
  const { setLoading } = useLoading();
  const [users, setUsers] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedSection, setSelectedSection] = useState("All");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${baseUrl}/api/tutors/getAllUsers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.IsSuccess && response.data.Result.data) {
          const { users, tutors } = response.data.Result.data;
          setUsers(users);
          setTutors(tutors);
          setFilteredUsers([...users, ...tutors]);
        } else {
          console.error("No user data found in the response.");
        }
      } catch (error) {
        handleErrors(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [setLoading]);

  const handleDelete = async (id, role) => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      await axios.delete(`${baseUrl}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (role.toLowerCase() === "tutor") {
        setTutors(tutors.filter((tutor) => tutor._id !== id));
      } else {
        setUsers(users.filter((user) => user._id !== id));
      }
      setFilteredUsers(filteredUsers.filter((user) => user._id !== id));
    } catch (error) {
      handleErrors(error);
    } finally {
      setLoading(false);
    }
  };

  const handleErrors = (error) => {
    console.error("Error:", error);
    if (error.response && error.response.data) {
      const errorMessages = error.response.data.ErrorMessage.map(
        (err) => err.message
      ).join(", ");
      toast.error(`${errorMessages}`);
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const getRoleDisplayName = (role) => {
    return role.toLowerCase() === "user"
      ? "Student"
      : capitalizeFirstLetter(role);
  };

  const handleTabChange = (tab) => {
    setSelectedSection(tab);
    if (tab === "All") {
      setFilteredUsers([...users, ...tutors]);
    } else if (tab === "Tutor") {
      setFilteredUsers(tutors);
    } else if (tab === "Student") {
      setFilteredUsers(users.filter((user) => user.role === "user"));
    } else {
      setFilteredUsers(users.filter((user) => user.role === "admin"));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster />
      <Sidebar
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      />

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">User Management</h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex justify-center mb-6">
            {["All", "Student", "Tutor", "Admin"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 mx-2 rounded-lg ${
                  selectedSection === tab
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <h3 className="text-xl font-semibold text-gray-600">
                  No Users Found
                </h3>
                <p className="text-gray-500">
                  There are no users available at the moment.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Name</th>
                    <th className="text-left py-4 px-4">Email</th>
                    <th className="text-left py-4 px-4">Role</th>
                    <th className="text-left py-4 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b last:border-0 hover:bg-gray-100"
                    >
                      <td className="py-4 px-4">{user.username}</td>
                      <td className="py-4 px-4">{user.email}</td>
                      <td className="py-4 px-4">
                        {getRoleDisplayName(user.role)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-4">
                          <button
                            className="flex items-center justify-center gap-2 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 focus:outline-none"
                            onClick={() => handleDelete(user._id, user.role)}
                          >
                            <span>Delete</span>
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
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

export default UserManagement;
