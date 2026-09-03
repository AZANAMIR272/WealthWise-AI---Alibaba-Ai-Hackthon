'use client';
import { useState, useEffect } from 'react';

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ww_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  return user;
}

// Helper to save user data after login/register/profile update
export function saveCurrentUser(data: { id: string; name: string; email: string; avatar?: string | null }) {
  const existing = (() => {
    try { return JSON.parse(localStorage.getItem('ww_user') || 'null'); } catch { return null; }
  })();
  const user = {
    userId: data.id,
    name: data.name,
    email: data.email,
    avatar: data.avatar !== undefined ? data.avatar : (existing?.avatar ?? null),
  };
  localStorage.setItem('ww_user', JSON.stringify(user));
  return user;
}

// Helper to clear on logout
export function clearCurrentUser() {
  localStorage.removeItem('ww_user');
}
