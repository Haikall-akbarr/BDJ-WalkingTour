"use client";

import { useEffect, useState } from 'react';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        const text = await response.text();
        const result = text ? JSON.parse(text) : null;

        if (!mounted) return;
        setUser(result?.user || null);
      } catch {
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading };
}
