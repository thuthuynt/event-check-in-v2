// Cache utility functions to prevent stale data issues

export function addCacheHeaders(response: Response, options: {
  noCache?: boolean;
  maxAge?: number;
  etag?: string;
} = {}): Response {
  const headers = new Headers(response.headers);
  
  if (options.noCache) {
    // Prevent caching for dynamic content
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  } else if (options.maxAge) {
    // Set specific cache duration
    headers.set('Cache-Control', `public, max-age=${options.maxAge}`);
  } else {
    // Default: short cache for API responses
    headers.set('Cache-Control', 'no-cache, must-revalidate');
  }
  
  if (options.etag) {
    headers.set('ETag', options.etag);
  }
  
  // Add version header for cache busting
  headers.set('X-App-Version', '1.0.0');
  headers.set('X-Timestamp', new Date().toISOString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export function createJsonResponse(data: any, status: number = 200, options: {
  noCache?: boolean;
  maxAge?: number;
} = {}): Response {
  const response = Response.json(data, { status });
  return addCacheHeaders(response, options);
}

export function getCacheBustingVersion(): string {
  return `v=${Date.now()}`;
}
