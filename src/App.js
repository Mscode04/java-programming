import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BlankComponent from "./Main/BlankComponent";
import LoginPage from "./Main/LoginPage";
import Main from "./Main/Main";
import Logout from "./Main/Logout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    localStorage.setItem("isAuthenticated", isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("adminId"); // Clear adminId on logout
  };

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setInstallPrompt(null);
      });
    }
  };

  return (
    <>
      {installPrompt && (
        <div style={{ position: "fixed", top: "10px", right: "10px", zIndex: 1000 }}>
          <button
            onClick={handleInstallClick}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Install App
          </button>
        </div>
      )}

      <Routes>
        {/* Blank Component */}
        <Route path="/" element={<BlankComponent />} />

        {/* Login Page */}
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/main" />
            )
          }
        />

        {/* Main Page (for authenticated admins) */}
        <Route
          path="/main/*"
          element={
            isAuthenticated ? (
              <Main isAuthenticated={isAuthenticated} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Logout Route */}
        <Route
          path="/logout"
          element={<Logout onLogout={handleLogout} />}
        />
      </Routes>
    </>
  );
}

export default App;