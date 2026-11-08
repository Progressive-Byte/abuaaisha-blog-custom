export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function withTrailingSlash(path: string): string {
  const [pathname, query] = path.split("?");
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withSlash = clean.endsWith("/") ? clean : `${clean}/`;
  return query ? `${withSlash}?${query}` : withSlash;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");

  const response = await fetch(`/api${withTrailingSlash(path)}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  const text = await response.text();
  let body: unknown = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  if (!response.ok) {
    const message = typeof (body as { error?: unknown }).error === "string" ? (body as { error: string }).error : "Request failed";
    throw new ApiError(message, response.status);
  }

  return body as T;
}
