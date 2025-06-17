import React, { useState } from "react";
import {
  Shuffle,
  Edit3,
  ArrowRight,
  MessageCircle,
  Shield,
  Zap,
} from "lucide-react";
import {
  generateRandomId,
  createCustomId,
  isValidId,
  isIdAvailable,
  saveUser,
} from "../../utils/helpers";
import { User } from "../../types";
import { Button } from "../UI/Button";
import { DigitInput } from "../UI/DigitInput";
import { Card } from "../UI/Card";
import { Footer } from "../Layout/Footer";

interface HomeProps {
  onUserCreated: (user: User) => void;
}

export const Home: React.FC<HomeProps> = ({ onUserCreated }) => {
  const [customId, setCustomId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRandomId = async () => {
    setLoading(true);
    setError("");

    try {
      // Get random ID from server
      const newId = await generateRandomId();

      const user: User = {
        id: newId,
        createdAt: new Date().toISOString(),
      };

      await saveUser(user); // Add await here
      onUserCreated(user);
    } catch (error) {
      setError("Failed to generate ID. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomId = async () => {
    setError("");

    if (!customId.trim()) {
      setError("Please enter an ID");
      return;
    }

    if (!isValidId(customId)) {
      setError("ID must be exactly 6 digits");
      return;
    }

    setLoading(true);

    try {
      const available = await isIdAvailable(customId);
      console.log("ID availability:", available);

      if (!available) {
        setError("This ID is already taken. Please choose another one.");
        return;
      }
      console.log("ID is available:", customId);
      await createCustomId(customId);

      const user: User = {
        id: customId,
        createdAt: new Date().toISOString(),
      };

      await saveUser(user); // Add await here
      onUserCreated(user);
    } catch (error) {
      setError("Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 pb-3">
            TempSix
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Send and receive anonymous messages using simple 6-digit IDs.
            <br />
            No sign-up required, completely private.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="flex items-center justify-center space-x-3 p-4">
              <Shield className="h-6 w-6 text-blue-500" />
              <span className="text-gray-700 font-medium">100% Anonymous</span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4">
              <Zap className="h-6 w-6 text-purple-500" />
              <span className="text-gray-700 font-medium">Instant Setup</span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4">
              <MessageCircle className="h-6 w-6 text-green-500" />
              <span className="text-gray-700 font-medium">
                Simple Messaging
              </span>
            </div>
          </div>
        </div>

        {/* ID Creation Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Random ID Option */}
          <Card hover className="p-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shuffle className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Get Random ID
              </h2>
              <p className="text-gray-600 mb-8">
                Let us generate a unique 6-digit ID for you instantly. Quick and
                simple!
              </p>
              <Button
                onClick={handleRandomId}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  <>
                    <Shuffle className="h-5 w-5 mr-2" />
                    Generate Random ID
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Custom ID Option */}
          <Card hover className="p-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Edit3 className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Choose Your ID
              </h2>
              <p className="text-gray-600 mb-8">
                Pick your own memorable 6-digit ID. We'll check if it's
                available.
              </p>

              <div className="space-y-4">
                <DigitInput
                  value={customId}
                  onChange={setCustomId}
                  error={error}
                />
                <Button
                  onClick={handleCustomId}
                  disabled={loading || customId.length !== 6}
                  size="lg"
                  className="w-full"
                  variant={customId.length === 6 ? "primary" : "secondary"}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                      Checking...
                    </div>
                  ) : (
                    <>
                      Create Custom ID
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* How it Works */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-8">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                1
              </div>
              <h4 className="font-semibold text-gray-800">Create Your ID</h4>
              <p className="text-gray-600 text-sm">
                Choose a random or custom 6-digit ID
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                2
              </div>
              <h4 className="font-semibold text-gray-800">Share Your ID</h4>
              <p className="text-gray-600 text-sm">
                Give your ID to friends so they can message you
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                3
              </div>
              <h4 className="font-semibold text-gray-800">Send & Receive</h4>
              <p className="text-gray-600 text-sm">
                Send messages to others and check your inbox
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
