import React, { useState } from "react";
import { LogOut, MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "../UI/Button";

interface HeaderProps {
  userId?: string;
  onLogout?: () => Promise<void>; // Updated to handle async operation
}

export const Header: React.FC<HeaderProps> = ({ userId, onLogout }) => {
  const [copied, setCopied] = useState(false);

  const handleExit = async () => {
    if (onLogout) {
      try {
        await onLogout();
      } catch (error) {
        console.error("❌ Error during logout:", error);
      }
    }
  };

  const handleCopyId = async () => {
    if (userId) {
      try {
        // Check if we're in a secure context and clipboard API is available
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(userId);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error("Clipboard API not available");
        }
      } catch (error) {
        // Mobile-friendly fallback
        const textArea = document.createElement("textarea");
        textArea.value = userId;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        } catch (err) {
          // Silent fail for production
        }

        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 sm:p-2 rounded-xl">
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TempSix
              </h1>
            </div>
          </div>

          {userId && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div
                className="bg-gradient-to-r from-blue-100 to-purple-100 px-2 py-1 sm:px-4 sm:py-2 rounded-xl cursor-pointer hover:from-blue-200 hover:to-purple-200 transition-all duration-200 active:scale-95 flex items-center space-x-1 sm:space-x-2"
                onClick={handleCopyId}
                title="Click to copy ID"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-600" />
                )}
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {copied ? "Copied!" : "ID:"}
                </span>
                <span className="font-mono font-bold text-blue-600 text-xs sm:text-sm">
                  {userId}
                </span>
              </div>
              {onLogout && (
                <Button variant="outline" size="sm" onClick={handleExit}>
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Exit</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
