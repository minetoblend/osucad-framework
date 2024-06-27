import type { AnimationMixins } from "./graphics/AnimationMixins";

declare global {
  namespace OsucadFrameworkMixins {
    interface Drawable extends AnimationMixins {}
  }
}

export {};
