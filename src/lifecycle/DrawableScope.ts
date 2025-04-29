let activeScopes: DrawableScope[] = []

export function getDrawableScope(): DrawableScope | null {
  return activeScopes[activeScopes.length - 1] ?? null
}

export function pushDrawableScope(scope: DrawableScope) {
  activeScopes.push(scope)
}

export function popDrawableScope() {
  activeScopes.pop()
}

export type DestroyCallback = () => void

export class DrawableScope {
  readonly parent: DrawableScope | null

  dependencies: Map<any, any> | null = null

  constructor(parent?: DrawableScope) {
    this.parent = parent ?? null
  }

  _destroyCallbacks?: DestroyCallback[]

  dispose() {
    if (this._destroyCallbacks !== undefined) {
      for (const callback of this._destroyCallbacks) {
        callback()
      }
    }
  }

  addDestroyCallback(callback: DestroyCallback) {
    this._destroyCallbacks ??= []
    this._destroyCallbacks.push(callback)
  }
}