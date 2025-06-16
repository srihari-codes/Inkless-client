import { useEffect, useRef } from "react";
import { User } from "../types";
import { deleteUser, clearUserData } from "../utils/helpers";

export const useCleanup = (user: User | null) => {
  const userRef = useRef(user);
  const cleanupExecutedRef = useRef(false);

  // Update ref when user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const performCleanup = async () => {
    if (cleanupExecutedRef.current || !userRef.current) {
      return;
    }

    cleanupExecutedRef.current = true;
    const userId = userRef.current.id;

    console.log(`🧹 Performing cleanup for user ${userId}`);

    // Clear local data first
    clearUserData();

    // Then delete from server
    await deleteUser(userId);
  };

  useEffect(() => {
    if (!user) return;

    // Handle page unload (tab close, browser close, navigation away)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Use sendBeacon for reliable cleanup during page unload
      if (userRef.current && !cleanupExecutedRef.current) {
        const userId = userRef.current.id;

        // Use sendBeacon for more reliable delivery during page unload
        const cleanupData = JSON.stringify({ userId });

        try {
          navigator.sendBeacon(
            `http://localhost:3000/api/users/${userId}`,
            new Blob([cleanupData], { type: "application/json" })
          );

          clearUserData();
          cleanupExecutedRef.current = true;

          console.log(`🧹 Cleanup beacon sent for user ${userId}`);
        } catch (error) {
          console.error("Error sending cleanup beacon:", error);
          // Fallback to synchronous cleanup
          performCleanup();
        }
      }
    };

    // Handle visibility change (tab becomes hidden)
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        userRef.current &&
        !cleanupExecutedRef.current
      ) {
        // Small delay to allow for tab switching vs actual closure
        setTimeout(() => {
          if (document.visibilityState === "hidden") {
            performCleanup();
          }
        }, 1000);
      }
    };

    // Handle page hide (more reliable than beforeunload)
    const handlePageHide = () => {
      if (userRef.current && !cleanupExecutedRef.current) {
        performCleanup();
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    // Cleanup function
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [user]);

  // Return manual cleanup function
  return { performCleanup };
};
