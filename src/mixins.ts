import type { AnimationMixins } from './graphics/AnimationMixins';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace OsucadFrameworkMixins {
    interface Drawable extends AnimationMixins {}
  }
}

export {};
