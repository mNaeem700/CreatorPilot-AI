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
  let apiBase = "";
  try {
    // @ts-ignore
    apiBase = import.meta.env.VITE_API_URL || "";
  } catch (e) {
    console.warn("[API Utility] import.meta.env is not available, using empty base:", e);
  }
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    const isAIS = hostname.includes("ai.studio") || hostname.includes("googleusercontent.com") || hostname.includes("run.app");
    
    if (isLocal || isAIS) {
      // In local development or AI Studio preview, we are in a co-located full-stack environment.
      // We must make API calls relative to the current site (which proxies to the co-located backend).
      // If apiBase points to an external site like netlify, it will break local development, so reset it.
      if (apiBase && !apiBase.includes(hostname) && !apiBase.includes("localhost") && !apiBase.includes("127.0.0.1")) {
        console.log(`[API Utility] Co-located environment detected. Overriding external VITE_API_URL (${apiBase}) to relative paths.`);
        apiBase = "";
      }
    } else {
      // Decoupled static deployment (e.g., Netlify).
      // We MUST point all API requests to our live Cloud Run server.
      // If VITE_API_URL is empty or points back to the Netlify front-end itself, override it.
      const isApiBasePointingToSelf = !apiBase || apiBase.includes(hostname) || apiBase.includes("netlify.app") || apiBase.includes("localhost");
      if (isApiBasePointingToSelf) {
        console.log("[API Utility] Static production environment detected. Overriding API base to Cloud Run backend.");
        apiBase = "https://ais-pre-x4ou4tthrt7geiseegurw2-321596100725.asia-southeast1.run.app";
      }
    }
  }

  // Clean up any double slashes when combining apiBase and urlString
  let requestUrl = urlString;
  if (urlString.startsWith("/") && !urlString.startsWith("//")) {
    if (apiBase) {
      const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
      requestUrl = `${base}${urlString}`;
    } else {
      requestUrl = urlString;
    }
  }

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
