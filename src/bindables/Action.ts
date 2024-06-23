import { getCurrentDrawablScope } from "./lifetimeScope";

export class Action<T> {
  #listeners = new Set<(value: T) => void>();

  addListener(listener: (value: T) => void, scoped: boolean = true) {
    this.#listeners.add(listener);
    if (scoped) {
      const scope = getCurrentDrawablScope();
      if (scope) {
        scope.onDispose(() => this.removeListener(listener));
      }
    }
  }

  removeListener(listener: (value: T) => void): boolean {
    return this.#listeners.delete(listener);
  }

  removeAllListeners() {
    this.#listeners.clear();
  }

  once(listener: (value: T) => void) {
    const newListener = (value: T) => {
      this.removeListener(newListener);
      listener(value);
    };
    this.addListener(newListener);
  }

  emit(value: T) {
    for (const listener of this.#listeners) {
      listener(value);
    }
  }
}
