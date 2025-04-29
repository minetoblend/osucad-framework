import { getDrawableScope } from "../DrawableScope.ts";

export type InjectionKey<T> =
  | InjectionToken<T>
  | (abstract new (...args: any[]) => T)

declare const typeKey: unique symbol

export type InjectionToken<T> = symbol & { [typeKey]?: T }

export function injectionToken<T>(description?: string): InjectionToken<T> {
  return Symbol(description)
}

export function provide<T>(key: InjectionKey<T>, value: T) {
  const scope = getDrawableScope()

  if (scope) {
    scope.dependencies ??= new Map()
    scope.dependencies.set(key, value)
  } else {
    console.warn("Tried calling provide() outside a component's setup function")
  }
}

export function inject<T>(key: InjectionKey<T>, required?: true): T
export function inject<T>(key: InjectionKey<T>, required: boolean): T | undefined
export function inject<T>(key: InjectionKey<T>, required = true): T | undefined {
  const scope = getDrawableScope()

  if (scope) {
    let current = scope.parent

    while (current) {
      if (current.dependencies) {
        const value = current.dependencies.get(key)
        if (value !== undefined)
          return value
      }

      current = current.parent
    }
  } else {
    console.warn("Tried calling inject() outside a component's setup function")
  }

  if (required) {
    throw new Error("Could not inject dependency") /* TODO: Add key to error message */
  }

  return undefined
}