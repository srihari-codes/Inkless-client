import React from 'react';
import { useAuth } from './hooks/useAuth';
import { Home } from './components/Home/Home';
import { Dashboard } from './components/Dashboard/Dashboard';
import { User } from './types';

function App() {
  const { user, setUser, loading, logout } = useAuth();

  const handleUserCreated = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Home onUserCreated={handleUserCreated} />
      )}
    </>
  );
}

export default App;