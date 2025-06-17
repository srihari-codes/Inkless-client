import React, { useState } from "react";
import { Send } from "lucide-react";
import { isValidId, isIdAvailable, sendMessage } from "../../utils/helpers";
import { Message } from "../../types";
import { Button } from "../UI/Button";
import { Card } from "../UI/Card";
import { MAX_MESSAGE_LENGTH } from "../../utils/constants";
import { SingleDigitInput } from "../UI/SingleDigitInput";

interface SendMessageProps {
  currentUserId: string;
  onMessageSent?: () => void;
}

export const SendMessage: React.FC<SendMessageProps> = ({
  currentUserId,
  onMessageSent,
}) => {
  const [recipientId, setRecipientId] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendMessage = async () => {
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!recipientId.trim()) {
        setError("Please enter a recipient ID");
        return;
      }

      if (!isValidId(recipientId)) {
        setError("Recipient ID must be exactly 6 digits");
        return;
      }

      if (recipientId === currentUserId) {
        setError("You cannot send a message to yourself");
        return;
      }

      if (await isIdAvailable(recipientId)) {
        setError("Recipient ID does not exist");
        return;
      }

      if (!messageContent.trim()) {
        setError("Please enter a message");
        return;
      }

      if (messageContent.length > MAX_MESSAGE_LENGTH) {
        setError(
          `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`
        );
        return;
      }

      setLoading(true);

      const message: Message = {
        id: Date.now().toString(),
        senderId: currentUserId,
        recipientId: recipientId,
        content: messageContent.trim(),
        timestamp: new Date().toISOString(),
      };

      await sendMessage(message); // Add await here

      setSuccess(`Message sent to ${recipientId}!`);
      setMessageContent("");

      if (onMessageSent) {
        onMessageSent();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Changed from checking Ctrl+Enter to just Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line in textarea
      handleSendMessage();
    }
  };

  const handleRecipientChange = (value: string) => {
    setRecipientId(value);
    // Reset error if it was "Recipient ID does not exist"
    if (error === "Recipient ID does not exist") {
      setError("");
    }
  };

  return (
    <Card className="p-6 h-fit">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-2 rounded-xl">
          <Send className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Send Message</h2>
      </div>

      <div className="space-y-4">
        <SingleDigitInput
          label="Recipient ID"
          value={recipientId}
          onChange={handleRecipientChange} // Changed from setRecipientId to handleRecipientChange
          isInvalid={error === "Recipient ID does not exist"}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={handleKeyPress} // Changed from onKeyPress to onKeyDown
            placeholder="Type your anonymous message here..."
            maxLength={MAX_MESSAGE_LENGTH}
            rows={6}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Tip: Press "Enter" to send quickly
            </p>
            <p className="text-xs text-gray-500">
              {messageContent.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <Button
          onClick={handleSendMessage}
          disabled={
            loading ||
            recipientId.length !== 6 || // Changed condition here
            !messageContent.trim()
          }
          className="w-full"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Sending...
            </div>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
