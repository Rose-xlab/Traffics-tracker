type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

export class Cache {
  private storage: Map<string, CacheEntry<any>>;
  private readonly defaultTTL: number;

  constructor(defaultTTLMinutes: number = 5) {
    this.storage = new Map();
    this.defaultTTL = defaultTTLMinutes * 60 * 1000;
  }

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = (ttlMinutes ?? this.defaultTTL / 60000) * 60000;
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.storage.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.storage.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.storage.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.storage.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.storage.delete(key);
      }
    }
  }
}

// Create cache instances for different purposes
export const dataCache = new Cache(5); // 5 minutes TTL
export const searchCache = new Cache(1); // 1 minute TTL
export const analyticsCache = new Cache(60); // 1 hour TTL