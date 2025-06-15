import { User, Message } from "../types";
import { STORAGE_KEYS, ID_LENGTH } from "./constants";
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
    // Only store current user in session storage instead of localStorage
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  // Change from localStorage to sessionStorage
  const user = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const getAllMessages = (): Message[] => {
  const messages = localStorage.getItem(STORAGE_KEYS.ALL_MESSAGES);
  return messages ? JSON.parse(messages) : [];
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

export const getMessagesForUser = (userId: string): Message[] => {
  const messages = getAllMessages();
  return messages.filter((message) => message.recipientId === userId);
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
