import React from 'react';
import { User } from '../../types';
import { SendMessage } from './SendMessage';
import { Inbox } from './Inbox';
import { Header } from '../Layout/Header';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header userId={user.id} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to your Dashboard
          </h1>
          <p className="text-gray-600">
            Send anonymous messages and check your inbox. Your ID is <span className="font-mono font-bold text-blue-600">{user.id}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SendMessage 
              currentUserId={user.id}
              onMessageSent={() => {
                // Could trigger inbox refresh if needed
              }}
            />
          </div>
          
          <div>
            <Inbox userId={user.id} />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">📤 Sending Messages:</h4>
              <ul className="space-y-1">
                <li>• Enter the recipient's 6-digit ID</li>
                <li>• Type your anonymous message</li>
                <li>• Click Send or press Ctrl+Enter</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">📥 Receiving Messages:</h4>
              <ul className="space-y-1">
                <li>• Share your ID: <span className="font-mono bg-blue-100 px-1 rounded">{user.id}</span></li>
                <li>• Messages appear in your inbox automatically</li>
                <li>• Click Refresh to check for new messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};