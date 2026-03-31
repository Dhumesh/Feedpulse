const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function getApiUrl() {
  const normalized = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

  if (typeof window === "undefined") {
    return normalized;
  }

  try {
    const url = new URL(normalized);

    if (url.hostname === "backend") {
      url.hostname = window.location.hostname || "localhost";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return normalized;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  const payload = (await response.json()) as {
    success: boolean;
    data: T;
    error: string | null;
    message: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.message || "Request failed");
  }

  return payload;
}

export { getApiUrl };
