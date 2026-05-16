const TOKEN_KEY = "skillssphere.auth.token";

const getApiBaseUrl = () => {
  try {
    const env = import.meta?.env;
    return env?.VITE_API_URL || env?.VITE_API_BASE_URL || "http://localhost:5000";
  } catch {
    return "http://localhost:5000";
  }
};

export const getAuthToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";

/**
 * Turn stored asset URLs into authenticated download URLs.
 * External URLs (e.g. Google profile photos) are returned unchanged.
 */
export const getProtectedAssetUrl = (url, token = getAuthToken()) => {
  if (!url || typeof url !== "string") return url;
  if (!token) return url;

  // Skip third-party URLs
  if (/^https?:\/\//i.test(url) && !url.includes("/uploads/") && !url.includes("/api/files/")) {
    return url;
  }

  let apiPath = url;

  // Legacy public static paths → protected API routes
  if (url.includes("/uploads/avatars/")) {
    const filename = url.split("/uploads/avatars/").pop()?.split("?")[0];
    apiPath = `/api/files/avatars/${filename}`;
  } else if (url.includes("/uploads/")) {
    const filename = url.split("/uploads/").pop()?.split("?")[0];
    apiPath = `/api/files/resumes/${filename}`;
  } else if (url.startsWith("/api/files/")) {
    apiPath = url.split("?")[0];
  } else if (url.startsWith("http")) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/api/files/")) {
        apiPath = parsed.pathname;
      }
    } catch {
      return url;
    }
  }

  if (!apiPath.startsWith("/api/files/")) return url;

  const base = getApiBaseUrl().replace(/\/$/, "");
  const separator = apiPath.includes("?") ? "&" : "?";
  return `${base}${apiPath}${separator}token=${encodeURIComponent(token)}`;
};
