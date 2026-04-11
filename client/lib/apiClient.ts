/**
 * API client that supports offline caching
 * When offline, returns cached data if available
 */

import { getOfflineCache, setOfflineCache } from './offlineStorage';

export interface FetchOptions extends RequestInit {
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
}

/**
 * Fetch with offline support
 * If offline and cache is available, returns cached data
 * Otherwise attempts to fetch from network
 */
export const apiFetch = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { cacheKey, cacheTTL, ...fetchOptions } = options;

  // Generate cache key from URL if not provided
  const finalCacheKey = cacheKey || `api_${url}`;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: T = await response.json();

    // Cache successful response
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      setOfflineCache(finalCacheKey, data, cacheTTL);
    }

    return data;
  } catch (error) {
    // If network request fails, try to return cached data
    const cachedData = getOfflineCache<T>(finalCacheKey);
    if (cachedData) {
      console.log('[apiClient] Using cached data for:', url);
      return cachedData;
    }

    // If no cache available, throw the error
    throw error;
  }
};

/**
 * Helper for GET requests with offline support
 */
export const apiGet = <T>(
  url: string,
  options?: Omit<FetchOptions, 'method'>
): Promise<T> => {
  return apiFetch<T>(url, {
    ...options,
    method: 'GET',
  });
};

/**
 * Helper for POST requests (no caching for mutations)
 */
export const apiPost = <T>(
  url: string,
  data?: any,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> => {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};
