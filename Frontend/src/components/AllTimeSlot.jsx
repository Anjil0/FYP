"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import {
  Calendar,
  Clock,
  Trash2,
  Plus,
  Filter,
  RefreshCcw,
  UserCheck,
  Edit,
} from "lucide-react";
import baseUrl from "/src/config/config";
import TimeSlotModal from "./TimeSlot";
import { useLoading } from "../config/LoadingContext";

const AllTimeSlots = () => {
  const { setLoading } = useLoading();
  const [editingSlot, setEditingSlot] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    subject: "",
    gradeLevel: "",
    day: "",
  });

  const [availableFilters, setAvailableFilters] = useState({
    subjects: new Set(),
    gradeLevels: new Set(),
    days: new Set(),
  });

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${baseUrl}/api/timeslots/getAllTimeSlots`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess && response.data.Result.timeSlots) {
        const slots = response.data.Result.timeSlots;
        setTimeSlots(slots);

        // Extract unique values for filters
        const newFilters = {
          subjects: new Set(),
          gradeLevels: new Set(),
          days: new Set(),
        };

        slots.forEach((slot) => {
          newFilters.subjects.add(slot.subjectName);

          newFilters.gradeLevels.add(slot.gradeLevel);

          slot.daysOfWeek.forEach((day) => {
            newFilters.days.add(day);
          });
        });

        setAvailableFilters(newFilters);
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

  useEffect(() => {
    fetchTimeSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete time slot
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this time slot?")) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(
        `${baseUrl}/api/timeslots/deleteTimeSlot/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.IsSuccess) {
        toast.success("Time slot deleted successfully");
        fetchTimeSlots();
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

  const filteredTimeSlots = timeSlots.filter((slot) => {
    const subjectMatch = filters.subject
      ? slot.subjectName.toLowerCase() === filters.subject.toLowerCase()
      : true;
    const gradeLevelMatch = filters.gradeLevel
      ? slot.gradeLevel === filters.gradeLevel
      : true;
    const dayMatch = filters.day ? slot.daysOfWeek.includes(filters.day) : true;
    return subjectMatch && gradeLevelMatch && dayMatch;
  });

  const resetFilters = () => {
    setFilters({
      subject: "",
      gradeLevel: "",
      day: "",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <Toaster richColors />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Time Slots</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
          Create New Time Slot
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Subject Select */}
          <select
            value={filters.subject}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, subject: e.target.value }))
            }
            className="px-3 py-2 border rounded-lg text-sm min-w-[150px]"
          >
            <option value="">All Subjects</option>
            {Array.from(availableFilters.subjects)
              .sort()
              .map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
          </select>

          {/* Grade Level Select */}
          <select
            value={filters.gradeLevel}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, gradeLevel: e.target.value }))
            }
            className="px-3 py-2 border rounded-lg text-sm min-w-[150px]"
          >
            <option value="">All Grades</option>
            {Array.from(availableFilters.gradeLevels)
              .sort((a, b) => {
                // Custom sort for grade levels
                const gradeA = Number.parseInt(a.match(/\d+/) || 0);
                const gradeB = Number.parseInt(b.match(/\d+/) || 0);
                if (gradeA && gradeB) return gradeA - gradeB;
                return a.localeCompare(b);
              })
              .map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
          </select>

          {/* Days Select */}
          <select
            value={filters.day}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, day: e.target.value }))
            }
            className="px-3 py-2 border rounded-lg text-sm min-w-[150px]"
          >
            <option value="">All Days</option>
            {Array.from(availableFilters.days)
              .sort((a, b) => {
                const days = [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ];
                return days.indexOf(a) - days.indexOf(b);
              })
              .map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
          </select>

          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTimeSlots.map((slot) => (
          <div
            key={slot._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
          >
            {/* Subject and Grade */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {slot.subjectName}
                </h3>
                <p className="text-gray-600">{slot.gradeLevel}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingSlot(slot);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  title="Edit time slot"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(slot._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Delete all time slots"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fee */}
            <div className="flex items-center gap-2 text-gray-600 bg-green-50 p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-green-700">
                Rs. {slot.fee}/month
              </span>
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <div className="space-y-1 w-full">
                  {slot.timeSlots.map((time, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-1.5 rounded-md ${
                        time.isBooked ? "bg-green-50" : "bg-blue-50"
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {time.startTime} - {time.endTime}
                      </span>
                      {time.isBooked ? (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Booked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Available
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Days */}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div className="flex flex-wrap gap-1">
                {slot.daysOfWeek.map((day) => {
                  // Get first 3 letters of day
                  const shortDay = day.substring(0, 3);
                  return (
                    <span
                      key={day}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                      title={day}
                    >
                      {shortDay}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {slot.notes && (
              <p className="text-sm text-gray-600 border-t pt-3">
                {slot.notes}
              </p>
            )}

            {/* Timezone */}
            <div className="text-xs text-gray-500 mt-2">
              Timezone: {slot.timezone}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTimeSlots.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No time slots found.</p>
        </div>
      )}

      <TimeSlotModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlot(null);
          fetchTimeSlots();
        }}
        editingSlot={editingSlot}
      />
    </div>
  );
};

export default AllTimeSlots;
