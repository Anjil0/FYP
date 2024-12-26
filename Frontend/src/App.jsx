import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import socket from "./socket.js";
import SignupPage from "./pages/Signup";
import LoginPage from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
// import ProtectedRoute from "./authUtils/PrivateRoute.jsx";
import Layout from "./authUtils/Layout.jsx";
import LandingPage from "./pages/Landing.jsx";

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const userId = JSON.parse(atob(token.split(".")[1])).sub;
      socket.emit("register", userId);
    }

    return () => {
      socket.emit("unregister");
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<Home />} />
          {/* <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          /> */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
