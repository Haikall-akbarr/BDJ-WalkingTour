"use client";

import { useEffect, useState, useCallback } from 'react';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  emergencyContact: string;
  address: string;
};

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const text = await response.text();
      const result = text ? JSON.parse(text) : null;
      setUser(result?.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setLoading(true);
    return load();
  }, [load]);

  return { user, loading, refresh };
}
