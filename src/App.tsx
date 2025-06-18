import React, { useState, useCallback, useEffect } from "react";
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
    console.log("🧹 User cleanup completed");
    setUser(null);
    setForceReload((prev) => prev + 1);
  }, [setUser]);

  // Enhanced usage of useAdvancedCleanup
  const {
    performCleanup,
    performCleanupWithRetry,
    updateActivity,
    isIdle,
    getTabCount,
    forceCleanup,
  } = useAdvancedCleanup(user, {
    idleTimeoutMs: 15 * 60 * 1000, // 15 minutes
    heartbeatIntervalMs: 5 * 60 * 1000, // 5 minutes
    tabSwitchGraceMs: 5 * 60 * 1000, // 5 minutes
    enableMultiTabCoordination: true,
    maxRetries: 3,
    onUserDeleted: handleUserDeleted,
  });

  // Debug information in development environment
  useEffect(() => {
    if (import.meta.env.MODE === "development" && user) {
      const interval = setInterval(() => {
        console.log(`📊 Debug - Tabs: ${getTabCount()}, Idle: ${isIdle()}`);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user, getTabCount, isIdle]);

  const handleUserCreated = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    try {
      // This will trigger user deletion with retry mechanism
      await performCleanupWithRetry("manual_exit", 3);
      // Then clear the user state
      setUser(null);
    } catch (error) {
      console.error("Failed to cleanup user:", error);
      // You might want to show an error message to the user here
    }
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
