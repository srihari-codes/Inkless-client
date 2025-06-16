import React, { useState, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useAdvancedCleanup } from "./hooks/useAdvancedCleanup";
import { Home } from "./components/Home/Home";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { User } from "./types";

function App() {
  const { user, setUser, loading, logout } = useAuth();
  const [forceReload, setForceReload] = useState(0);

  // Handle user deletion from server
  const handleUserDeleted = useCallback(() => {
    console.log("User was deleted, forcing reload to get new ID");
    // Clear user state and force component re-render
    setUser(null);
    setForceReload((prev) => prev + 1);
  }, [setUser]);

  const { performCleanup, updateActivity } = useAdvancedCleanup(user, {
    idleTimeoutMs: 10 * 60 * 1000, // 10 minutes
    heartbeatIntervalMs: 30 * 1000, // 30 seconds
    tabSwitchGraceMs: 30 * 1000, // 30 seconds grace period
    onUserDeleted: handleUserDeleted,
  });

  const handleUserCreated = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    // Perform cleanup before logout
    await performCleanup("manual_logout");
    logout();
  };

  // Handle user activity to reset idle timer
  const handleActivity = () => {
    updateActivity();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div key={forceReload} onClick={handleActivity} onKeyDown={handleActivity}>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Home onUserCreated={handleUserCreated} />
      )}
    </div>
  );
}

export default App;
