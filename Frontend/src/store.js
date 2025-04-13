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
          navigate("/");
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

    // Validate required fields
    if (
      !editedUser.username ||
      !editedUser.grade ||
      !editedUser.phoneNumber ||
      !editedUser.address
    ) {
      toast.error("All required fields must be filled");
      setLoading(false);
      return;
    }

    // Validate preferred subjects
    if (
      !Array.isArray(editedUser.preferredSubjects) ||
      editedUser.preferredSubjects.length < 1
    ) {
      toast.error("At least one preferred subject is required");
      setLoading(false);
      return;
    }

    try {
      let formData = new FormData();
      let isImageUpdated = false;

      // Add user details to formData
      formData.append("username", editedUser.username);
      formData.append("grade", editedUser.grade);
      formData.append("phoneNumber", editedUser.phoneNumber);
      formData.append("address", editedUser.address);

      // Add preferred subjects to formData
      editedUser.preferredSubjects.forEach((subject, index) => {
        formData.append(`preferredSubjects[${index}]`, subject);
      });

      // Check if there is a new image
      if (editedUser.image && editedUser.image.startsWith("data:")) {
        const base64Response = await fetch(editedUser.image);
        const blob = await base64Response.blob();
        const file = new File([blob], "profile-image.jpg", { type: blob.type });

        // Change the field name to "image" to match the backend
        formData.append("image", file);
        isImageUpdated = true;
      }

      // Send the form data to the API
      const response = await axios.put(
        `${baseUrl}/api/users/updateUser`, // API endpoint
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Handle the response
      if (response.data && response.data.Result) {
        set({ user: response.data.Result.userData, isEditing: false });
        toast.success("Profile updated successfully!");
      } else {
        toast.error(
          response.data?.ErrorMessage?.message || "Something went wrong"
        );
      }
    } catch (err) {
      console.error("Error updating profile details:", err);

      let errorMessage = "An error occurred while updating the profile.";

      if (err.response) {
        errorMessage =
          err.response.data?.ErrorMessage?.[0]?.message ||
          err.response.data?.ErrorMessage?.message ||
          err.response.data?.message ||
          `Request failed with status code ${err.response.status}`;
      } else if (err.request) {
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
    const { isEditing, user } = get();
    if (!isEditing) {
      set({
        isEditing: true,
        editedUser: { ...user },
      });
    } else {
      set({ isEditing: false });
    }
  },
}));
