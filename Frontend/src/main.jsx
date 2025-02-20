import { LoadingProvider } from "./config/LoadingContext.jsx";
import GlobalLoading from "./components/GlobalLoading.jsx";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <LoadingProvider>
    <GlobalLoading />
    <App />
  </LoadingProvider>
);
