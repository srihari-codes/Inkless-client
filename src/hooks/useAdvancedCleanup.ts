// ===== STEP 4: Advanced cleanup hook (src/hooks/useAdvancedCleanup.ts) =====

import { useEffect, useRef, useCallback } from "react";
import { User } from "../types";
import {
  deleteUser,
  clearUserData,
  sendHeartbeat,
  checkUserExists,
} from "../utils/helpers";

interface UseAdvancedCleanupOptions {
  idleTimeoutMs?: number; // Default 10 minutes
  heartbeatIntervalMs?: number; // Default 30 seconds
  tabSwitchGraceMs?: number; // Default 30 seconds grace period for tab switches
  onUserDeleted?: () => void; // Callback when user is deleted
}

export const useAdvancedCleanup = (
  user: User | null,
  options: UseAdvancedCleanupOptions = {}
) => {
  const {
    idleTimeoutMs = 10 * 60 * 1000, // 10 minutes
    heartbeatIntervalMs = 30 * 1000, // 30 seconds
    tabSwitchGraceMs = 30 * 1000, // 30 seconds
    onUserDeleted,
  } = options;

  const userRef = useRef(user);
  const cleanupExecutedRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const tabSwitchTimeoutRef = useRef<number | null>(null);
  const isTabVisibleRef = useRef(true);
  const existenceCheckIntervalRef = useRef<number | null>(null);

  // Update refs when user changes
  useEffect(() => {
    userRef.current = user;
    if (user) {
      cleanupExecutedRef.current = false;
      lastActivityRef.current = Date.now();
    }
  }, [user]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    resetIdleTimeout();
  }, []);

  // Perform cleanup
  const performCleanup = useCallback(
    async (reason: string) => {
      if (cleanupExecutedRef.current || !userRef.current) {
        return;
      }

      cleanupExecutedRef.current = true;
      const userId = userRef.current.id;

      console.log(
        `🧹 Performing cleanup for user ${userId}, reason: ${reason}`
      );

      // Clear all intervals and timeouts
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      if (tabSwitchTimeoutRef.current) {
        clearTimeout(tabSwitchTimeoutRef.current);
        tabSwitchTimeoutRef.current = null;
      }
      if (existenceCheckIntervalRef.current) {
        clearInterval(existenceCheckIntervalRef.current);
        existenceCheckIntervalRef.current = null;
      }

      // Clear local data first
      clearUserData();

      // Then delete from server
      await deleteUser(userId);

      // Notify parent component
      if (onUserDeleted) {
        onUserDeleted();
      }
    },
    [onUserDeleted]
  );

  // Reset idle timeout
  const resetIdleTimeout = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      performCleanup("idle_timeout");
    }, idleTimeoutMs);
  }, [idleTimeoutMs, performCleanup]);

  // Check if user still exists on server
  const checkUserExistence = useCallback(async () => {
    if (!userRef.current || cleanupExecutedRef.current) return;

    const exists = await checkUserExists(userRef.current.id);
    if (!exists) {
      console.log(`User ${userRef.current.id} no longer exists on server`);
      performCleanup("server_deleted");
    }
  }, [performCleanup]);

  useEffect(() => {
    if (!user) return;

    // Start heartbeat interval
    heartbeatIntervalRef.current = setInterval(async () => {
      if (userRef.current && !cleanupExecutedRef.current) {
        const success = await sendHeartbeat(userRef.current.id);
        if (!success) {
          console.log("Heartbeat failed, user may have been deleted");
          performCleanup("heartbeat_failed");
        }
      }
    }, heartbeatIntervalMs);

    // Start periodic existence check
    existenceCheckIntervalRef.current = setInterval(checkUserExistence, 60000); // Check every minute

    // Set initial idle timeout
    resetIdleTimeout();

    // Activity listeners
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    activityEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });

    // Handle visibility change with grace period
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;

      if (document.hidden) {
        // Tab became hidden - start grace period timer
        tabSwitchTimeoutRef.current = setTimeout(() => {
          // If still hidden after grace period, it's likely a real closure
          if (
            document.hidden &&
            userRef.current &&
            !cleanupExecutedRef.current
          ) {
            performCleanup("tab_hidden_timeout");
          }
        }, tabSwitchGraceMs);
      } else {
        // Tab became visible - cancel grace period timer
        if (tabSwitchTimeoutRef.current) {
          clearTimeout(tabSwitchTimeoutRef.current);
          tabSwitchTimeoutRef.current = null;
        }
        // Update activity when tab becomes visible
        updateActivity();
      }
    };

    // Handle beforeunload (browser/tab close)
    const handleBeforeUnload = () => {
      if (userRef.current && !cleanupExecutedRef.current) {
        const userId = userRef.current.id;

        // Use sendBeacon for reliable cleanup during page unload
        try {
          const success = navigator.sendBeacon(
            `http://localhost:3000/api/users/${userId}`,
            JSON.stringify({ immediate: true })
          );

          if (success) {
            clearUserData();
            cleanupExecutedRef.current = true;
            console.log(`🧹 Cleanup beacon sent for user ${userId}`);
          }
        } catch (error) {
          console.error("Error sending cleanup beacon:", error);
        }
      }
    };

    // Handle pagehide (more reliable than beforeunload)
    const handlePageHide = () => {
      if (userRef.current && !cleanupExecutedRef.current) {
        performCleanup("page_hide");
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    // Cleanup function
    return () => {
      // Remove activity listeners
      activityEvents.forEach((event) => {
        document.removeEventListener(event, updateActivity, true);
      });

      // Remove page event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);

      // Clear intervals and timeouts
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (tabSwitchTimeoutRef.current) {
        clearTimeout(tabSwitchTimeoutRef.current);
      }
      if (existenceCheckIntervalRef.current) {
        clearInterval(existenceCheckIntervalRef.current);
      }
    };
  }, [
    user,
    heartbeatIntervalMs,
    updateActivity,
    performCleanup,
    resetIdleTimeout,
    tabSwitchGraceMs,
    checkUserExistence,
  ]);

  // Return manual cleanup function and activity updater
  return {
    performCleanup: (reason: string = "manual") => performCleanup(reason),
    updateActivity,
    isIdle: () => Date.now() - lastActivityRef.current > idleTimeoutMs,
  };
};
