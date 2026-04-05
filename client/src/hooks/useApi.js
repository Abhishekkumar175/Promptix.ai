import { useAuth } from "@clerk/clerk-react";

const API_BASE = "http://localhost:3000";

/** Public (no-auth) fetcher for open endpoints like /api/templates */
export async function publicFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/**
 * Returns a fetch wrapper with the Clerk auth token attached.
 * Usage:
 *   const api = useApi();
 *   const data = await api.get("/api/chat/threads");
 *   const result = await api.post("/api/templates/id/use");
 */
export function useApi() {
  const { getToken } = useAuth();

  const authFetch = async (url, options = {}) => {
    const token = await getToken();
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  return {
    get: (url) => authFetch(url),
    post: (url, body) => authFetch(url, { method: "POST", body: JSON.stringify(body) }),
    del: (url) => authFetch(url, { method: "DELETE" }),
    /**
     * SSE streaming fetch — returns a ReadableStreamDefaultReader
     * Caller is responsible for reading chunks.
     */
    stream: async (url, body) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Stream request failed: ${res.status}`);
      return res.body.getReader();
    },
  };
}
