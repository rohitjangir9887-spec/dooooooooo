import { sessionStorage } from "./sessionStorage.js";

const apiBase = import.meta.env.VITE_API_URL || "";

export async function api(path, options = {}) {
  const session = sessionStorage.get();
  const url = apiBase + path;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }

  return response.json();
}
