// GlobalLoading.js
import { useLoading } from "../config/LoadingContext";
import { HashLoader } from "react-spinners";

const GlobalLoading = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(4px)",
        transition: "opacity 0.3s ease-in-out",
        opacity: 1,
        zIndex: 1000,
      }}
    >
      <HashLoader color="#7e00ff" size={60} speedMultiplier={1.5} />
    </div>
  );
};

export default GlobalLoading;
