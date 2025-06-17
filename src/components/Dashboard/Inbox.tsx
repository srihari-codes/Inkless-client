import React, { useState } from "react";
import { Inbox as InboxIcon, MessageSquare, RefreshCw } from "lucide-react";
import { loadMessages } from "../../hooks/useMessages";
import { formatTimestamp } from "../../utils/helpers";
import { Button } from "../UI/Button";
import { Card } from "../UI/Card";

const avatarEmojis = [
  "✨",
  "🌟",
  "💫",
  "⭐",
  "🌙",
  "🍀",
  "🎯",
  "💎",
  "🎪",
  "🎭",
  "🎨",
  "🎬",
  "🎮",
  "🎧",
  "🎵",
];

interface InboxProps {
  userId: string;
}

export const Inbox: React.FC<InboxProps> = ({ userId }) => {
  const { messages, refreshMessages, loading } = loadMessages(userId);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    setIsSpinning(true);
    refreshMessages();
    setTimeout(() => setIsSpinning(false), 1000);
  };

  return (
    <Card className="p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-2 rounded-xl">
            <InboxIcon className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            Inbox ({messages.length})
          </h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || isSpinning}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 transition-all duration-300 ${
              isSpinning ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-500 text-sm">
              Share your ID{" "}
              <span className="font-mono font-bold text-blue-600">
                {userId}
              </span>{" "}
              with friends to receive messages
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                    {
                      avatarEmojis[
                        Math.floor(Math.random() * avatarEmojis.length)
                      ]
                    }
                  </div>
                  <span className="font-mono text-sm font-medium text-gray-600">
                    From: {message.senderIdDisplay}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>

              <div className="pl-10">
                <p className="text-gray-800 leading-relaxed break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {messages.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Messages are retrieved and deleted from the database
          </p>
        </div>
      )}
    </Card>
  );
};
