import axios from "axios";
import { toast } from "sonner";

const isValidToken = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate > new Date();
  } catch (e) {
    return false;
  }
};

const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!isValidToken(refreshToken)) {
      return null;
    }

    const response = await axios.post("/api/refreshAccessToken", {
      refreshToken,
    });

    const { accessToken } = response.data;
    localStorage.setItem("accessToken", accessToken);
    return accessToken;
  } catch (error) {
    toast.error(`Failed to Refresh the Token: ${error.message}`);
    return null;
  }
};

export { isValidToken, refreshAccessToken };
