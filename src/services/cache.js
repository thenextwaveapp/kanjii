/**
 * Simple in-memory cache with TTL (time-to-live)
 * Reduces unnecessary database queries
 */

const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if it exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if expired/missing
 */
export function getCached(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now > cached.expiresAt) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Set data in cache with optional TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default 5 min)
 */
export function setCached(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Invalidate specific cache key
 * @param {string} key - Cache key to invalidate
 */
export function invalidate(key) {
  cache.delete(key);
}

/**
 * Invalidate all keys matching a pattern
 * @param {string} pattern - String that key should include
 */
export function invalidatePattern(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Wrapper for async functions with caching
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data
 * @param {number} ttl - Time to live in milliseconds
 */
export async function fetchWithCache(key, fetchFn, ttl = DEFAULT_TTL) {
  const cached = getCached(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  setCached(key, data, ttl);
  return data;
}
