type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

class RateLimiter {
  private requests: Map<string, number[]>;
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.requests = new Map();
    this.config = config;
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing timestamps for this key
    let timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    timestamps = timestamps.filter(time => time > windowStart);
    
    // Check if rate limit is exceeded
    if (timestamps.length >= this.config.maxRequests) {
      return true;
    }
    
    // Add new timestamp and update the map
    timestamps.push(now);
    this.requests.set(key, timestamps);
    
    return false;
  }

  clear(): void {
    this.requests.clear();
  }
}

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});