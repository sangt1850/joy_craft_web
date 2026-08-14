const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("accessToken");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, ...error };
  }

  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
