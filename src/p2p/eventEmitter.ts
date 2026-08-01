export class TypedEventEmitter<T extends object> {
  private readonly listeners = new Map<keyof T, Set<(...args: unknown[]) => void>>();

  on<K extends keyof T>(event: K, fn: T[K]): void {
    const set = this.listeners.get(event) ?? new Set<(...args: unknown[]) => void>();
    set.add(fn as (...args: unknown[]) => void);
    this.listeners.set(event, set);
  }

  off<K extends keyof T>(event: K, fn: T[K]): void {
    this.listeners.get(event)?.delete(fn as (...args: unknown[]) => void);
  }

  protected emit<K extends keyof T>(event: K, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
  }
}
