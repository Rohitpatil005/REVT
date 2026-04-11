/**
 * Offline Storage utility for caching API responses
 * Allows the app to work with cached data when offline
 */

const STORAGE_PREFIX = 'app_cache_';
const ONLINE_STATUS_KEY = 'online_status';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Check if a cache entry is still valid
 */
const isCacheValid = (entry: CacheEntry<any>): boolean => {
  if (!entry.ttl) return true;
  return Date.now() - entry.timestamp < entry.ttl;
};

/**
 * Store data in offline cache
 */
export const setOfflineCache = <T>(key: string, data: T, ttl?: number): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    const cacheKey = `${STORAGE_PREFIX}${key}`;
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn('[OfflineStorage] Failed to set cache:', key, error);
  }
};

/**
 * Retrieve data from offline cache
 */
export const getOfflineCache = <T>(key: string): T | null => {
  try {
    const cacheKey = `${STORAGE_PREFIX}${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);
    if (isCacheValid(entry)) {
      return entry.data;
    }

    // Remove expired cache
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.warn('[OfflineStorage] Failed to get cache:', key, error);
    return null;
  }
};

/**
 * Remove specific cache entry
 */
export const clearOfflineCache = (key: string): void => {
  try {
    const cacheKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn('[OfflineStorage] Failed to clear cache:', key, error);
  }
};

/**
 * Clear all offline cache
 */
export const clearAllOfflineCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[OfflineStorage] Failed to clear all cache:', error);
  }
};

/**
 * Store the online status
 */
export const setOnlineStatus = (isOnline: boolean): void => {
  try {
    localStorage.setItem(ONLINE_STATUS_KEY, JSON.stringify(isOnline));
  } catch (error) {
    console.warn('[OfflineStorage] Failed to set online status:', error);
  }
};

/**
 * Get the last known online status
 */
export const getLastOnlineStatus = (): boolean => {
  try {
    const stored = localStorage.getItem(ONLINE_STATUS_KEY);
    return stored ? JSON.parse(stored) : true;
  } catch (error) {
    console.warn('[OfflineStorage] Failed to get online status:', error);
    return true;
  }
};

/**
 * Cache auth user data
 */
export const cacheAuthUser = (user: any): void => {
  setOfflineCache('auth_user', user, 7 * 24 * 60 * 60 * 1000); // 7 days
};

/**
 * Get cached auth user
 */
export const getCachedAuthUser = (): any | null => {
  return getOfflineCache('auth_user');
};

/**
 * Clear auth cache
 */
export const clearAuthCache = (): void => {
  clearOfflineCache('auth_user');
};
