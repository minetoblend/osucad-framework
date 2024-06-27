export class DependencyContainer implements ReadonlyDependencyContainer {
  private readonly dependencies = new Map<any, any>();

  constructor(private readonly parent?: ReadonlyDependencyContainer) {}

  provide(keyOrValue: any, value?: any): void {
    if (!value && "constructor" in keyOrValue) {
      this.dependencies.set(keyOrValue.constructor, keyOrValue);
      return;
    }

    this.dependencies.set(keyOrValue, value);
  }

  resolveOptional<T>(key: new (...args: any[]) => T): T;
  resolveOptional<T>(key: InjectionToken<T>): T;
  resolveOptional<T>(key: any): T | undefined {
    if (this.dependencies.has(key)) {
      return this.dependencies.get(key);
    }

    return this.parent?.resolveOptional<T>(key);
  }

  resolve<T>(key: new (...args: any[]) => T): T;
  resolve<T>(key: InjectionToken<T>): T;
  resolve<T>(key: any): T {
    const value = this.resolveOptional<T>(key);

    if (value === undefined) {
      throw new Error(`Could not resolve dependency for key: ${key}`);
    }

    return value;
  }
}

export interface ReadonlyDependencyContainer {
  resolveOptional<T>(key: new (...args: any[]) => T): T;

  resolve<T>(key: new (...args: any[]) => T): T;
  resolve<T>(key: InjectionToken<T>): T;
}

export interface InjectionToken<T> extends Symbol { 
}