import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * useSubscription
 * ──────────────────
 * Fetches the current user's plan, usage, and feature flags from
 * GET /api/subscription/me. Exposes a `refresh()` so pages can re-pull
 * right after a checkout completes or a generation succeeds (so the
 * usage bar updates without a full page reload).
 */
const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API = import.meta.env.VITE_BACKEND_URL;

  const fetchSubscription = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API}/api/subscription/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscription(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, loading, error, refresh: fetchSubscription };
};

export default useSubscription;
