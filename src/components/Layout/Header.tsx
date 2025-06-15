import React from 'react';
import { LogOut, MessageCircle } from 'lucide-react';
import { Button } from '../UI/Button';

interface HeaderProps {
  userId?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userId, onLogout }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Anonymous Messages
              </h1>
            </div>
          </div>
          
          {userId && (
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-xl">
                <span className="text-sm font-medium text-gray-700">ID: </span>
                <span className="font-mono font-bold text-blue-600">{userId}</span>
              </div>
              {onLogout && (
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};