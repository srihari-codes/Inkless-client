import { useEffect, useRef, useCallback } from "react";
import { User } from "../types";
import {
  deleteUser,
  clearUserData,
  sendHeartbeat,
  checkUserExists,
} from "../utils/helpers";
import { API_ENDPOINTS } from "../config/constants";

// Update the default values in the options interface
interface UseAdvancedCleanupOptions {
  idleTimeoutMs?: number; // Default 15 minutes
  heartbeatIntervalMs?: number; // Default 5 minutes
  tabSwitchGraceMs?: number; // Default 5 minutes grace period for tab switches
  onUserDeleted?: () => void;
  enableMultiTabCoordination?: boolean;
  maxRetries?: number;
}

export const useAdvancedCleanup = (
  user: User | null,
  options: UseAdvancedCleanupOptions = {}
) => {
  const {
    idleTimeoutMs = 15 * 60 * 1000, // 15 minutes
    heartbeatIntervalMs = 5 * 60 * 1000, // 5 minutes
    tabSwitchGraceMs = 5 * 60 * 1000, // 5 minutes
    onUserDeleted,
    enableMultiTabCoordination = true,
    maxRetries = 3,
  } = options;

  // Refs for persistent state
  const userRef = useRef(user);
  const cleanupExecutedRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const tabSwitchTimeoutRef = useRef<number | null>(null);
  const existenceCheckIntervalRef = useRef<number | null>(null);
  const isTabVisibleRef = useRef(true);
  const tabIdRef = useRef(
    `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const isPageRefreshRef = useRef(false);

  // Detect if running on mobile device
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  const effectiveHeartbeatInterval = isMobile
    ? Math.min(heartbeatIntervalMs, 5 * 60 * 1000) // Cap at 5 minutes for mobile
    : heartbeatIntervalMs;

  // Update refs when user changes
  useEffect(() => {
    userRef.current = user;
    if (user) {
      cleanupExecutedRef.current = false;
      lastActivityRef.current = Date.now();
    }
  }, [user]);

  // Multi-tab coordination functions
  const getTabCountKey = useCallback(
    (userId: string) => `tab-count-${userId}`,
    []
  );
  const getCleanupLockKey = useCallback(
    (userId: string) => `cleanup-lock-${userId}`,
    []
  );

  const incrementTabCount = useCallback(
    (userId: string) => {
      if (!enableMultiTabCoordination) return;
      const key = getTabCountKey(userId);
      const count = parseInt(localStorage.getItem(key) || "0", 10);
      localStorage.setItem(key, (count + 1).toString());
      console.log(`📊 Tab count for user ${userId}: ${count + 1}`);
    },
    [enableMultiTabCoordination, getTabCountKey]
  );

  const decrementTabCount = useCallback(
    (userId: string): number => {
      if (!enableMultiTabCoordination) return 0;
      const key = getTabCountKey(userId);
      const count = Math.max(
        0,
        parseInt(localStorage.getItem(key) || "1", 10) - 1
      );
      localStorage.setItem(key, count.toString());
      console.log(`📊 Tab count for user ${userId}: ${count}`);
      return count;
    },
    [enableMultiTabCoordination, getTabCountKey]
  );

  const acquireCleanupLock = useCallback(
    (userId: string): boolean => {
      if (!enableMultiTabCoordination) return true;
      const key = getCleanupLockKey(userId);
      const existingLock = localStorage.getItem(key);

      if (!existingLock) {
        localStorage.setItem(key, tabIdRef.current);
        // Double-check we got the lock (race condition protection)
        setTimeout(() => {
          return localStorage.getItem(key) === tabIdRef.current;
        }, 50);
        return true;
      }
      return false;
    },
    [enableMultiTabCoordination, getCleanupLockKey]
  );

  const releaseCleanupLock = useCallback(
    (userId: string) => {
      if (!enableMultiTabCoordination) return;
      const key = getCleanupLockKey(userId);
      if (localStorage.getItem(key) === tabIdRef.current) {
        localStorage.removeItem(key);
      }
    },
    [enableMultiTabCoordination, getCleanupLockKey]
  );

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    resetIdleTimeout();
  }, []);

  // Enhanced cleanup with retry logic
  const performCleanupWithRetry = useCallback(
    async (reason: string, retries: number = maxRetries): Promise<void> => {
      if (cleanupExecutedRef.current || !userRef.current) {
        return;
      }

      const userId = userRef.current.id;
      console.log(
        `🧹 Attempting cleanup for user ${userId}, reason: ${reason}, retries left: ${retries}`
      );

      // Multi-tab coordination
      if (enableMultiTabCoordination) {
        const remainingTabs = decrementTabCount(userId);
        if (remainingTabs > 0) {
          console.log(`🚫 Skipping cleanup - ${remainingTabs} tabs still open`);
          return;
        }

        if (!acquireCleanupLock(userId)) {
          console.log(`🚫 Another tab is handling cleanup for user ${userId}`);
          return;
        }
      }

      cleanupExecutedRef.current = true;

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

      // Attempt cleanup with retry logic
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // Clear local data first (always succeeds)
          clearUserData();

          // Attempt server deletion
          await deleteUser(userId);

          console.log(
            `✅ Cleanup successful for user ${userId} on attempt ${attempt}`
          );

          // Release cleanup lock on success
          if (enableMultiTabCoordination) {
            releaseCleanupLock(userId);
          }

          // Notify parent component
          if (onUserDeleted) {
            onUserDeleted();
          }

          return; // Success - exit retry loop
        } catch (error) {
          console.error(
            `❌ Cleanup attempt ${attempt} failed for user ${userId}:`,
            error
          );

          if (attempt === retries) {
            // Final attempt failed - cleanup locally anyway
            console.log(
              `🔄 Final cleanup attempt failed - cleaning local data only`
            );
            clearUserData();

            if (enableMultiTabCoordination) {
              releaseCleanupLock(userId);
            }

            if (onUserDeleted) {
              onUserDeleted();
            }
          } else {
            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
    },
    [
      maxRetries,
      enableMultiTabCoordination,
      decrementTabCount,
      acquireCleanupLock,
      releaseCleanupLock,
      onUserDeleted,
    ]
  );

  // Regular cleanup function (backward compatibility)
  const performCleanup = useCallback(
    (reason: string) => {
      return performCleanupWithRetry(reason, 1);
    },
    [performCleanupWithRetry]
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

  // Enhanced heartbeat for mobile
  const enhancedHeartbeat = useCallback(async (): Promise<boolean> => {
    if (!userRef.current || cleanupExecutedRef.current) return false;

    try {
      const success = await sendHeartbeat(userRef.current.id);
      if (!success) {
        console.log(
          `💔 Heartbeat failed for user ${userRef.current.id} - user may have been deleted`
        );
        performCleanup("heartbeat_failed");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Heartbeat error:", error);
      return false;
    }
  }, [performCleanup]);

  // Check if user still exists on server
  const checkUserExistence = useCallback(async () => {
    if (!userRef.current || cleanupExecutedRef.current) return;

    try {
      const exists = await checkUserExists(userRef.current.id);
      if (!exists) {
        console.log(`👻 User ${userRef.current.id} no longer exists on server`);
        performCleanup("server_deleted");
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
    }
  }, [performCleanup]);

  // Detect page refresh vs actual navigation
  const detectPageRefresh = useCallback(() => {
    // Method 1: Check navigation timing
    const navigationEntries = performance.getEntriesByType("navigation");
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      if (navEntry.type === "reload") {
        isPageRefreshRef.current = true;
        return true;
      }
    }

    // Method 2: Check if page was loaded from cache
    if (performance.navigation && performance.navigation.type === 1) {
      isPageRefreshRef.current = true;
      return true;
    }

    return false;
  }, []);

  // Enhanced beforeunload handler
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      // Don't cleanup on page refresh
      if (isPageRefreshRef.current || detectPageRefresh()) {
        console.log("🔄 Page refresh detected - preserving user session");
        return;
      }

      if (!userRef.current || cleanupExecutedRef.current) return;

      const userId = userRef.current.id;
      console.log(`🚪 Page unload detected for user ${userId}`);

      // Try sendBeacon first (most reliable for page unload)
      try {
        // Use FormData for sendBeacon (better browser support)
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("immediate", "true");
        formData.append("reason", "page_unload");

        const beaconSuccess = navigator.sendBeacon(
          API_ENDPOINTS.DELETE_USER(userId),
          formData
        );

        if (beaconSuccess) {
          clearUserData();
          cleanupExecutedRef.current = true;
          console.log(`📡 Cleanup beacon sent successfully for user ${userId}`);
        } else {
          throw new Error("Beacon failed");
        }
      } catch (error) {
        console.warn("Beacon failed, trying fetch with keepalive:", error);

        // Fallback to fetch with keepalive
        try {
          fetch(API_ENDPOINTS.DELETE_USER(userId), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ immediate: true, reason: "page_unload" }),
            keepalive: true,
          })
            .then(() => {
              console.log(`🌐 Cleanup fetch completed for user ${userId}`);
            })
            .catch((err) => {
              console.error("Cleanup fetch failed:", err);
            });

          clearUserData();
          cleanupExecutedRef.current = true;
        } catch (fetchError) {
          console.error("All cleanup methods failed:", fetchError);
          // Still clear local data as last resort
          clearUserData();
          cleanupExecutedRef.current = true;
        }
      }
    },
    [detectPageRefresh]
  );

  // Handle visibility change with enhanced mobile support
  const handleVisibilityChange = useCallback(() => {
    isTabVisibleRef.current = !document.hidden;

    if (document.hidden) {
      console.log("👁️ Tab became hidden");
      // Start grace period timer
      tabSwitchTimeoutRef.current = setTimeout(() => {
        // If still hidden after grace period and not a quick tab switch
        if (document.hidden && userRef.current && !cleanupExecutedRef.current) {
          const timeSinceHidden = Date.now() - lastActivityRef.current;
          if (timeSinceHidden >= tabSwitchGraceMs) {
            performCleanup("tab_hidden_timeout");
          }
        }
      }, tabSwitchGraceMs);
    } else {
      console.log("👁️ Tab became visible");
      // Cancel grace period timer
      if (tabSwitchTimeoutRef.current) {
        clearTimeout(tabSwitchTimeoutRef.current);
        tabSwitchTimeoutRef.current = null;
      }
      // Update activity when tab becomes visible
      updateActivity();
    }
  }, [tabSwitchGraceMs, performCleanup, updateActivity]);

  // Detect refresh keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect F5 or Ctrl+R/Cmd+R
      if (
        e.key === "F5" ||
        (e.key === "r" && (e.ctrlKey || e.metaKey)) ||
        (e.key === "R" && (e.ctrlKey || e.metaKey))
      ) {
        isPageRefreshRef.current = true;
        console.log("⌨️ Refresh shortcut detected");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Main effect - setup all listeners and intervals
  useEffect(() => {
    if (!user) return;

    console.log(`🚀 Starting advanced cleanup for user ${user.id}`);

    // Multi-tab coordination setup
    if (enableMultiTabCoordination) {
      incrementTabCount(user.id);
    }

    // Start heartbeat interval
    heartbeatIntervalRef.current = setInterval(
      enhancedHeartbeat,
      effectiveHeartbeatInterval
    );

    // Start periodic existence check (every 2 minutes)
    existenceCheckIntervalRef.current = setInterval(
      checkUserExistence,
      2 * 60 * 1000
    );

    // Set initial idle timeout
    resetIdleTimeout();

    // Activity listeners
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "touchmove",
      "click",
      "focus",
    ];

    activityEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, {
        passive: true,
        capture: true,
      });
    });

    // Page event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload); // More reliable on mobile

    // Storage event listener for cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key?.startsWith("tab-count-") ||
        e.key?.startsWith("cleanup-lock-")
      ) {
        console.log(`📡 Cross-tab storage event: ${e.key} = ${e.newValue}`);
      }
    };

    if (enableMultiTabCoordination) {
      window.addEventListener("storage", handleStorageChange);
    }

    // Cleanup function
    return () => {
      console.log(`🛑 Cleaning up advanced cleanup for user ${user.id}`);

      // Remove activity listeners
      activityEvents.forEach((event) => {
        document.removeEventListener(event, updateActivity, true);
      });

      // Remove page event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);

      if (enableMultiTabCoordination) {
        window.removeEventListener("storage", handleStorageChange);
      }

      // Clear intervals and timeouts
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

      // Handle tab count decrement in cleanup
      if (enableMultiTabCoordination && user) {
        const remainingTabs = decrementTabCount(user.id);
        if (remainingTabs === 0 && !cleanupExecutedRef.current) {
          // This was the last tab - trigger cleanup
          console.log("🔥 Last tab closing - triggering cleanup");
          performCleanupWithRetry("last_tab_cleanup", 1);
        }
      }
    };
  }, [
    user,
    effectiveHeartbeatInterval,
    updateActivity,
    handleVisibilityChange,
    handleBeforeUnload,
    resetIdleTimeout,
    enhancedHeartbeat,
    checkUserExistence,
    enableMultiTabCoordination,
    incrementTabCount,
    decrementTabCount,
    performCleanupWithRetry,
  ]);

  // Return enhanced API
  return {
    performCleanup: (reason: string = "manual") =>
      performCleanupWithRetry(reason),
    performCleanupWithRetry,
    updateActivity,
    isIdle: () => Date.now() - lastActivityRef.current > idleTimeoutMs,
    getTabCount: () =>
      enableMultiTabCoordination && userRef.current
        ? parseInt(
            localStorage.getItem(getTabCountKey(userRef.current.id)) || "0",
            10
          )
        : 1,
    forceCleanup: () => {
      cleanupExecutedRef.current = false; // Reset flag
      return performCleanupWithRetry("force_cleanup");
    },
  };
};
