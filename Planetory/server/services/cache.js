import NodeCache from 'node-cache';

const cacheInstance = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export function getCache(key) {
  return cacheInstance.get(key);
}

export function setCache(key, value, ttlSeconds) {
  return cacheInstance.set(key, value, ttlSeconds || 600);
}

export function deleteCache(key) {
  return cacheInstance.del(key);
}

export function getCacheStats() {
  return cacheInstance.getStats();
}

export function flushAll() {
  return cacheInstance.flushAll();
}
