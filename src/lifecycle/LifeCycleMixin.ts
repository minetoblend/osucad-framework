import { Container, extensions } from "pixi.js";
import { DrawableScope, popDrawableScope, pushDrawableScope } from "./DrawableScope.ts";
import { LoadState } from "./LoadState.ts";
import { loadChild } from "./utils/loadChild.ts";

export interface LifeCycleInternals extends Container {
  _loadState: LoadState
  _scope: DrawableScope

  _setup(parentScope?: DrawableScope): void
}

export const LifeCycleMixin: Partial<LifeCycleInternals> = {
  _loadState: LoadState.NotLoaded,
  get loadState() {
    return this._loadState
  },
  _setup(parentScope?: DrawableScope) {
    if (this._loadState !== LoadState.NotLoaded)
      return

    this._loadState = LoadState.Loading

    try {
      pushDrawableScope(this._scope = new DrawableScope(parentScope))

      this.on('childAdded', loadChild)
      this.on('destroyed', this._scope.dispose, this._scope)

      this.setup()

      for (const c of this.children as LifeCycleInternals[]) {
        if (c._loadState !== LoadState.NotLoaded)
          c._setup(this._scope)
      }

      this._loadState = LoadState.Loaded

      this.emit('load', this)
    } finally {
      popDrawableScope()
    }
  },
  setup() {
  },
} as LifeCycleInternals

extensions.mixin(Container, LifeCycleMixin)