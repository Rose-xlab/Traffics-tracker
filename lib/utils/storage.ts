type StorageType = 'local' | 'session';

class Storage {
  private readonly storage: globalThis.Storage;

  constructor(type: StorageType) {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error storing data:', error);
    }
  }

  remove(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  has(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }
}

export const localStorage = new Storage('local');
export const sessionStorage = new Storage('session');