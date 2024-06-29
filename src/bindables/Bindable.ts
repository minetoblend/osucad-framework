import { getCurrentDrawablScope } from './lifetimeScope';

export type BindableListener<T> = (value: T) => void;

export class Bindable<T> {
  constructor(value: T, scoped: boolean = true) {
    this.#value = value;
    if (scoped) {
      const scope = getCurrentDrawablScope();
      if (scope) {
        scope.onDispose(() => {
          this.removeAllListeners();
        });
      }
    }
  }

  #value: T;

  get value(): T {
    return this.#value;
  }

  set value(value: T) {
    this.#value = value;
    this.triggerChange();
  }

  #listeners = new Set<BindableListener<T>>();

  addOnChangeListener(
    listener: BindableListener<T>,
    options: AddOnChangeListenerOptions = {},
  ) {
    this.#listeners.add(() => listener(this.value));
    if (options.scoped === false) {
      const scope = getCurrentDrawablScope();
      if (scope) {
        scope.onDispose(() => this.removeOnChangeListener(listener));
      }
    }
    if (options.immediate) {
      listener(this.value);
    }
  }

  removeOnChangeListener(listener: BindableListener<T>): boolean {
    return this.#listeners.delete(listener);
  }

  removeAllListeners() {
    this.#listeners.clear();
  }

  triggerChange() {
    for (const listener of this.#listeners) {
      listener(this.value);
    }
  }

  get listenerCount() {
    return this.#listeners.size;
  }
}

export interface AddOnChangeListenerOptions {
  scoped?: boolean;
  immediate?: boolean;
}
