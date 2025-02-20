import {
  MessageCircle,
  Clock,
  Package,
  Book,
  User,
  Calendar,
} from "lucide-react";
import { toast, Toaster } from "sonner";

const StudentDashboard = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster />
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-2xl font-bold">Welcome, Student!</h1>
        <span className="text-2xl">😊</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <Calendar className="w-5 h-5" />
                Upcoming Sessions
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-gray-500">There are no upcoming sessions.</div>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full">
              Find a tutor
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <MessageCircle className="w-5 h-5" />
                Messages
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="font-medium">Thomas M.</div>
                <div className="text-sm text-gray-500 truncate">
                  Hi, welcome to TutorEase! How can I help...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <Package className="w-5 h-5" />
                Packages
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-gray-500">There are no active packages.</div>
          </div>
        </div>

        {/* My Tutors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <User className="w-5 h-5" />
                My Tutors
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-gray-500">
              You have not had a session with a tutor yet.
            </div>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full">
              Get Help Finding a Tutor
            </button>
          </div>
        </div>

        {/* Past Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <Clock className="w-5 h-5" />
                Past Sessions
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-gray-500">There are no past sessions.</div>
          </div>
        </div>

        {/* Past Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <Book className="w-5 h-5" />
                Past Assignments
              </div>
              <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                View all
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="text-gray-500">There are no past assignments.</div>
          </div>
        </div>
      </div>

      {/* Digital Classroom Card */}
      <div className="mt-6">
        <div className="bg-gray-700 text-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-600">
            <div className="font-semibold text-lg">Digital Classroom</div>
          </div>
          <div className="p-4">
            <p>
              Get familiar with all the tools and features inside the digital
              classroom before you start a session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
