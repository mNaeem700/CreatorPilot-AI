/**
 * CreatorPilot API fetch wrapper utility
 * Consistently logs requests, injects auth headers, and handles 401/403 codes.
 */

export interface APIFetchOptions extends RequestInit {
  // Option to skip automatic auth header injection or redirect logic if needed
  skipAuthInject?: boolean;
  skipAuthRedirect?: boolean;
}

export async function apiFetch(
  input: RequestInfo | URL,
  options: APIFetchOptions = {}
): Promise<Response> {
  const { skipAuthInject, skipAuthRedirect, ...init } = options;
  const method = init.method || "GET";
  const urlString = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);

  // 1. Prepare and inject Auth Headers from localStorage
  const headers = new Headers(init.headers);
  if (!skipAuthInject) {
    try {
      const storedUserString = localStorage.getItem("creatorpilot_user");
      if (storedUserString) {
        const storedUser = JSON.parse(storedUserString);
        if (storedUser?.uid) {
          // Add both headers to be highly compatible with server rules
          if (!headers.has("x-user-id")) {
            headers.set("x-user-id", storedUser.uid);
          }
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${storedUser.uid}`);
          }
        }
      }
    } catch (e) {
      console.error("[API Utility] Error parsing stored user for request headers:", e);
    }
  }

  // 2. Perform consistent request logging
  const apiBase = (import.meta as any).env.VITE_API_URL || "";
  const requestUrl = (urlString.startsWith("/") && !urlString.startsWith("//")) 
    ? `${apiBase}${urlString}` 
    : urlString;

  console.log(`[API Request] [${method}] ${requestUrl} (mapped from ${urlString})`);

  try {
    const response = await fetch(requestUrl, {
      ...init,
      headers,
    });

    // 3. Perform consistent response logging & error handling
    if (!response.ok) {
      console.error(
        `[API Error] [${method}] ${urlString} returned status ${response.status}: ${response.statusText}`
      );

      // Handle 401 (Unauthorized) / 403 (Forbidden)
      if ((response.status === 401 || response.status === 403) && !skipAuthRedirect) {
        console.warn(`[API Auth Redirect] Redirecting user due to status ${response.status}`);
        
        // Clear local credentials so the user doesn't get stuck in a login loop
        localStorage.removeItem("creatorpilot_user");
        
        // Dispatch a global event so App.tsx can update the application state
        window.dispatchEvent(new CustomEvent("unauthorized-api-call", {
          detail: { status: response.status, url: urlString }
        }));
      }
    } else {
      console.log(`[API Success] [${method}] ${urlString} - Status ${response.status}`);
    }

    return response;
  } catch (error) {
    // Log network/fetch failures
    console.error(`[API Network/Fetch Error] [${method}] ${urlString}:`, error);
    throw error;
  }
}
