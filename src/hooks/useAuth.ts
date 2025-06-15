import { useState, useEffect } from 'react';
import { User } from '../types';
import { getCurrentUser } from '../utils/helpers';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('anonymous_messaging_current_user');
    setUser(null);
  };

  return { user, setUser, loading, logout };
};