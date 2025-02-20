// Sidebar.js
import { Link } from "react-router-dom";
import {
  Users,
  Book,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import axios from "axios";
import baseUrl from "./../config/config";
import { useNavigate } from "react-router-dom";

// eslint-disable-next-line react/prop-types
const Sidebar = ({ selectedSection, setSelectedSection }) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await axios.post(
        `${baseUrl}/api/users/logout`,
        {},
        {
          withCredentials: true,
        }
      );

      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");

      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
      navigate("/");
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-blue-600">TutorEase</h1>
        <p className="text-sm text-gray-500">Admin Portal</p>
      </div>

      <nav className="p-4">
        {[
          {
            id: "dashboard",
            icon: <TrendingUp />,
            label: "Dashboard",
            path: "/adminDashboard",
          },
          {
            id: "users",
            icon: <Users />,
            label: "User Management",
            path: "/adminUsers",
          },
          {
            id: "tutors",
            icon: <Book />,
            label: "Tutor Verification",
            path: "/tutorVerification",
          },
          {
            id: "payments",
            icon: <DollarSign />,
            label: "Payments",
            path: "/adminDashboard",
          },
          {
            id: "settings",
            icon: <Settings />,
            label: "Settings",
            path: "/adminDashboard",
          },
        ].map((item) => (
          <Link to={item.path} key={item.id}>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1
                ${
                  selectedSection === item.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => setSelectedSection(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          </Link>
        ))}
      </nav>

      <div className="mt-auto p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg"
        >
          <LogOut />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
