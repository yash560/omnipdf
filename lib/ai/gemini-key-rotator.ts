import { MongoClient } from 'mongodb';

// Load keys from environment (comma-separated or single key)
const ENV_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map((k) => k.trim())
  .filter((k) => k.startsWith('AIzaSy'));

class GeminiKeyRotator {
  private keys: string[] = [...ENV_KEYS];
  private activeIndex = 0;
  private cooldowns = new Map<string, number>();
  private permanentFails = new Set<string>();
  private lastDbSync = 0;

  private readonly COOLDOWN_DURATION_MS = 10 * 60 * 1000; // 10 minutes for 429
  private readonly DB_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Attempt background sync with Webvale MongoDB if connection string exists
    this.syncKeysFromDatabase().catch(() => {});
  }

  /**
   * Sync dynamic keys from TheWebVale MongoDB 'api-keys' collection
   */
  async syncKeysFromDatabase(): Promise<void> {
    const now = Date.now();
    if (now - this.lastDbSync < this.DB_SYNC_INTERVAL_MS) return;

    const mongoUri = process.env.MONGODB_URI || process.env.THEWEBVALE_MONGO_URI;
    if (!mongoUri) return;

    try {
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || 'thewebvale');
      const collection = db.collection('api-keys');
      const docs = await collection.find({ type: { $in: ['gemini', 'gemini-api', 'google-ai'] } }).toArray();

      for (const doc of docs) {
        if (doc.value && typeof doc.value === 'string' && doc.value.startsWith('AIzaSy')) {
          this.addKey(doc.value.trim());
        }
      }

      await client.close();
      this.lastDbSync = now;
      console.log(`[GeminiKeyRotator] Synced with Webvale DB. Total keys in pool: ${this.keys.length}`);
    } catch (err: any) {
      console.warn(`[GeminiKeyRotator] MongoDB key sync skipped: ${err.message}`);
    }
  }

  /**
   * Get the next available healthy Gemini API Key
   */
  getNextKey(): string {
    const now = Date.now();
    const total = this.keys.length;

    if (total === 0) {
      return process.env.GEMINI_API_KEY || '';
    }

    for (let i = 0; i < total; i++) {
      const idx = (this.activeIndex + i) % total;
      const candidateKey = this.keys[idx];

      if (this.permanentFails.has(candidateKey)) continue;

      const cooldownExpiry = this.cooldowns.get(candidateKey) || 0;
      if (now > cooldownExpiry) {
        this.activeIndex = (idx + 1) % total;
        return candidateKey;
      }
    }

    // Fallback round-robin if all temporarily cooled down
    const safeIdx = this.activeIndex % total;
    this.activeIndex = (this.activeIndex + 1) % total;
    return this.keys[safeIdx];
  }

  /**
   * Mark key as rate limited (429) -> 10m cooldown
   */
  markRateLimited(key: string): void {
    if (!key) return;
    this.cooldowns.set(key, Date.now() + this.COOLDOWN_DURATION_MS);
    console.warn(`[GeminiKeyRotator] Key rate-limited (429). Cooldown for 10m: ${key.substring(0, 8)}...`);
  }

  /**
   * Mark key as permanently invalid (400/403)
   */
  markPermanentFailure(key: string, reason = '403'): void {
    if (!key) return;
    this.permanentFails.add(key);
    console.error(`[GeminiKeyRotator] Key permanently failed (${reason}). Quarantined: ${key.substring(0, 8)}...`);
  }

  /**
   * Add custom key to pool
   */
  addKey(key: string): void {
    const trimmed = key.trim();
    if (trimmed && !this.keys.includes(trimmed)) {
      this.keys.unshift(trimmed);
    }
  }

  /**
   * Health metrics and pool diagnostic status
   */
  getPoolStatus() {
    const now = Date.now();
    const activeKeys = this.keys.filter((k) => {
      if (this.permanentFails.has(k)) return false;
      const expiry = this.cooldowns.get(k) || 0;
      return now > expiry;
    });

    return {
      totalKeys: this.keys.length,
      healthyKeys: activeKeys.length,
      quarantinedKeys: this.permanentFails.size,
      cooledDownKeys: this.keys.length - activeKeys.length - this.permanentFails.size,
      activeKeyPrefix: `${this.keys[this.activeIndex % this.keys.length]?.substring(0, 8)}...`,
      poolHealthPercent: Math.round((activeKeys.length / Math.max(1, this.keys.length)) * 100),
    };
  }
}

// Global singleton instance across serverless execution
export const keyRotator = new GeminiKeyRotator();
