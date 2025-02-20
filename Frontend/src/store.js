import { create } from "zustand";
import axios from "axios";
import baseUrl from "/src/config/config";
import { toast } from "sonner";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user: user }),
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  loginUser: async (formData, navigate, setLoading) => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await axios.post(
        `${baseUrl}/api/users/login`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          },
        }
      );

      if (response.data.IsSuccess) {
        toast.success(response.data.Result.message);
        localStorage.setItem("accessToken", response.data.Result.accessToken);
        localStorage.setItem("userRole", response.data.Result.userRole);
        set({ user: response.data.Result.user, isAuthenticated: true });
        const userRole = response.data.Result.userRole;
        if (userRole === "admin") {
          navigate("/adminDashboard");
        } else if (userRole === "user") {
          navigate("/stdDashboard");
        } else if (userRole === "tutor") {
          navigate("/tutorDashboard");
        } else {
          navigate("/home");
        }
      } else if (
        response.data.StatusCode === 403 &&
        response.data.Result.redirect
      ) {
        toast.error(
          response.data.ErrorMessage[0]?.message ||
            "Login failed. Please try again."
        );
        navigate("/verify", { state: { email: formData.email } });
      } else {
        toast.error(
          response.data.ErrorMessage[0]?.message ||
            "Login failed. Please try again."
        );
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
  },
}));

export const useProfileStore = create((set, get) => ({
  user: null,
  isEditing: false,
  editedUser: {},

  fetchUserDetails: async (setLoading) => {
    const token = localStorage.getItem("accessToken");
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/users/getUserDetails/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data && response.data.Result) {
        set({
          user: response.data.Result?.userData,
          editedUser: response.data.Result.userData,
        });
      } else {
        toast.error(
          "Failed to fetch user data. Please check the API response."
        );
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      toast.error("Server Error, Please try again later.");
    } finally {
      setLoading(false);
    }
  },

  updateUserDetails: async (setLoading) => {
    const { editedUser } = get();
    const token = localStorage.getItem("accessToken");
    setLoading(true);
    try {
      const response = await axios.put(
        `${baseUrl}/api/users/updateUser`,
        editedUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data && response.data.Result) {
        set({ user: response.data.Result.userData, isEditing: false });
        toast.success("Profile updated successfully!");
      } else {
        toast.error(
          response.data.ErrorMessage.message || "Something went wrong"
        );
      }
    } catch (err) {
      console.error("Error updating profile details:", err);

      let errorMessage = "An error occurred while updating the profile.";

      if (err.response) {
        errorMessage =
          err.response.data?.ErrorMessage?.[0]?.message ||
          err.response.data?.message ||
          `Request failed with status code ${err.response.status}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please try again later.";
      } else {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  },

  setEditedUser: (field, value) =>
    set((state) => ({
      editedUser: { ...state.editedUser, [field]: value },
    })),

  toggleEditing: () => {
    set({ isEditing: !get().isEditing });
  },
}));
