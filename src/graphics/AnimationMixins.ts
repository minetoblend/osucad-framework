import anime, { type EasingOptions } from "animejs";
import type { Drawable } from "./drawables/Drawable";
import type { IVec2 } from "../math";

export interface AnimationMixins {
  fadeTo(options: FadeOptions): void;
  fadeOut(options: AnimationOptions): void;
  fadeIn(options: AnimationOptions): void;
  moveTo(options: MoveToOptions): void;
  rotateTo(options: RotateToOptions): void;
}

export interface AnimationOptions {
  duration?: number;
  easing?: EasingOptions;
}

export interface FadeOptions extends AnimationOptions {
  alpha: number;
}

export type MoveToOptions = AnimationOptions &
  (
    | {
        position: IVec2;
      }
    | {
        x?: number;
        y?: number;
      }
  );

  export type RotateToOptions = AnimationOptions & (
    {
      rotation: number;
    } | {
      angleDegress: number;
    }
  )

export const animationMixins: Partial<Drawable> = {
  fadeTo(options: FadeOptions) {
    console.log(options)
    anime({
      targets: this,
      alpha: options.alpha,
      duration: options.duration ?? 0,
      easing: options.easing ?? "linear",
    });
  },
  fadeOut(options: AnimationOptions) {
    this.fadeTo({ ...options, alpha: 0 });
  },
  fadeIn(options: AnimationOptions) {
    this.fadeTo({ ...options, alpha: 1 });
  },
  moveTo(options: MoveToOptions) {
    if ("position" in options) {
      anime({
        targets: this,
        x: options.position.x,
        y: options.position.y,
        duration: options.duration ?? 0,
        easing: options.easing ?? "linear",
      });
    } else {
      anime({
        targets: this,
        x: options.x,
        y: options.y,
        duration: options.duration ?? 0,
        easing: options.easing ?? "linear",
      });
    }
  },
  rotateTo(options: RotateToOptions) {
    if ("rotation" in options) {
      anime({
        targets: this,
        rotation: options.rotation,
        duration: options.duration ?? 0,
        easing: options.easing ?? "linear",
      });
    } else {
      anime({
        targets: this,
        rotation: (options.angleDegress * Math.PI) / 180,
        duration: options.duration ?? 0,
        easing: options.easing ?? "linear",
      });
    }
  }
} as Drawable;
