import './LifeCycleSystem'
import './LifeCycleMixin'
import { LoadState } from "./LoadState.ts";

export * from './DrawableScope'
export * from './LoadState'
export * from './LifeCycleMixin'
export * from './LifeCycleSystem'
export * from './utils/provideInject'
export * from './utils/loadChild'

declare global {
  namespace PixiMixins {
    interface Container {
      get loadState(): LoadState

      setup(): void
    }

    interface ContainerEvents {
      load: [event: Container];
    }
  }
}