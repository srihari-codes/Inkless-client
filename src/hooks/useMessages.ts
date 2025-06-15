import { useState, useEffect } from "react";
import { MessageWithSender } from "../types";
import { API_ENDPOINTS } from "../config/constants";

export const loadMessages = (userId: string | null) => {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshMessages = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.GET_MESSAGES(userId));
      const data = await response.json();

      if (data.success) {
        const messagesWithSender = data.data.messages.map((msg: any) => ({
          ...msg,
          senderIdDisplay: msg.senderId,
        }));
        setMessages(messagesWithSender);
      } else {
        console.error("Failed to fetch messages:", data.message);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMessages();
  }, [userId]);

  return { messages, refreshMessages, loading };
};
