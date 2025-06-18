import { User, Message } from "../types";
import { STORAGE_KEYS } from "./constants";
import { API_ENDPOINTS } from "../config/constants";

export const generateRandomId = async (): Promise<string> => {
  try {
    const response = await fetch(API_ENDPOINTS.GENERATE_ID, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get random ID from server");
    }

    const result = await response.json();
    return result.data.id;
  } catch (error) {
    console.error("Error generating random ID:", error);
    throw error;
  }
};

export const isValidId = (id: string): boolean => {
  return /^\d{6}$/.test(id);
};

export const isIdAvailable = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.CHECK_ID}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check ID availability");
    }

    const result = await response.json();
    console.log("ID availability response:", result);
    return result.data.available;
  } catch (error) {
    console.error("Error checking ID availability:", error);
    throw error;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    // Use sessionStorage consistently for temporary sessions
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  try {
    // Use sessionStorage consistently
    const user = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const sendMessage = async (message: Message): Promise<void> => {
  try {
    const response = await fetch(API_ENDPOINTS.SEND_MESSAGE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Failed to send message");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffInHours < 168) {
    // 7 days
    return date.toLocaleDateString([], {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};
export const deleteUser = async (
  userId: string,
  immediate: boolean = false
): Promise<void> => {
  try {
    const response = await fetch(API_ENDPOINTS.DELETE_USER(userId), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        immediate,
        timestamp: Date.now(),
        userAgent: navigator.userAgent.substring(0, 100), // For debugging
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(
        result.error || result.message || "Failed to delete user"
      );
    }

    console.log(`✅ User ${userId} deleted successfully`, result.data);
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    throw error; // Re-throw so cleanup can handle retries
  }
};

export const sendHeartbeat = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(API_ENDPOINTS.HEARTBEAT(userId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error sending heartbeat:", error);
    return false;
  }
};

export const checkUserExists = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(API_ENDPOINTS.USER_EXISTS(userId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.data.exists;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
};

export const clearUserData = (): void => {
  try {
    // Clear both session and local storage for cleanup
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEYS.ALL_MESSAGES);

    // Also clear any localStorage items related to the current user
    const currentUser = getCurrentUser();
    if (currentUser) {
      localStorage.removeItem(`tab-count-${currentUser.id}`);
      localStorage.removeItem(`cleanup-lock-${currentUser.id}`);
    }

    console.log("✅ User data cleared from both storages");
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
};

export const createCustomId = async (id: string): Promise<boolean> => {
  console.log("Setting custom ID:", id);
  try {
    const response = await fetch(API_ENDPOINTS.CUSTOM_ID(id), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to set custom ID");
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error setting custom ID:", error);
    return false;
  }
};

export const getBrowserCapabilities = () => {
  return {
    hasBeacon: typeof navigator !== "undefined" && "sendBeacon" in navigator,
    hasKeepAlive: typeof fetch !== "undefined",
    hasLocalStorage: typeof localStorage !== "undefined",
    hasSessionStorage: typeof sessionStorage !== "undefined",
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ),
    isStandalone:
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches,
  };
};
