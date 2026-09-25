let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(path.startsWith("/") ? path : `/api/${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && token) onUnauthorized();
  if (!response.ok) {
    const envelope = data.error;
    const message =
      typeof envelope === "string" ? envelope : envelope?.message || "Request failed";
    throw new ApiError(message, response.status, data);
  }
  return data;
}
