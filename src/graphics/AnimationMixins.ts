import gsap from "gsap";
import type { IVec2 } from "../math";
import { Color, type ColorSource } from "../pixi";
import { type Drawable } from "./drawables/Drawable";

export interface AnimationMixins {
  fadeTo(options: FadeOptions): void;
  fadeOut(options: AnimationOptions): void;
  fadeIn(options: AnimationOptions): void;
  moveTo(options: MoveToOptions): void;
  rotateTo(options: RotateToOptions): void;
  fadeColorTo(options: FadeColorToOptions): void;
  flashColorTo(options: FadeColorToOptions): void;
}

export interface AnimationOptions {
  duration?: number;
  easing?: gsap.EaseFunction | gsap.EaseString;
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

export type RotateToOptions = AnimationOptions &
  (
    | {
        rotation: number;
      }
    | {
        angleDegress: number;
      }
  );

export type FadeColorToOptions = AnimationOptions & {
  color: ColorSource;
};

export const animationMixins: Partial<Drawable> = {
  fadeTo(options: FadeOptions) {
    gsap.to(this, {
      alpha: options.alpha,
      duration: (options.duration ?? 0) / 1000,
      ease: options.easing ?? "linear",
    });
  },
  fadeOut(options: AnimationOptions) {
    this.fadeTo({ ...options, alpha: 0 });
  },
  fadeIn(options: AnimationOptions) {
    this.alpha = 0;
    this.fadeTo({ ...options, alpha: 1 });
  },
  moveTo(options: MoveToOptions) {
    if ("position" in options) {
      gsap.to(this, {
        x: options.position.x,
        y: options.position.y,
        duration: (options.duration ?? 0) / 1000,
        easing: options.easing ?? "linear",
      });
    } else {
      gsap.to(this, {
        x: options.x,
        y: options.y,
        duration: (options.duration ?? 0) / 1000,
        easing: options.easing ?? "linear",
      });
    }
  },
  rotateTo(options: RotateToOptions) {
    if ("rotation" in options) {
      gsap.to(this, {
        rotation: options.rotation,
        duration: (options.duration ?? 0) / 1000,
        easing: options.easing ?? "linear",
      });
    } else {
      gsap.to(this, {
        rotation: (options.angleDegress * Math.PI) / 180,
        duration: (options.duration ?? 0) / 1000,
        easing: options.easing ?? "linear",
      });
    }
  },
  fadeColorTo(options: FadeColorToOptions) {
    (this as any)['_color'] ??= this.color.toRgba()
    const color = (this as any)['_color']

    gsap.to(color, {
      ...Color.shared.setValue(options.color).toRgba(),
      duration: (options.duration ?? 0) / 1000 / 2,
      ease: options.easing ?? "linear",
      onUpdate: () => {
        this.color = {
          r: color.r * 255,
          g: color.g * 255,
          b: color.b * 255,
          a: color.a,
        }
      }
    }).yoyo(true)
  },
  flashColorTo(options: FadeColorToOptions) {
    (this as any)['_color'] ??= this.color.toRgba()
    const color = (this as any)['_color']

    gsap.to(color, {
      ...Color.shared.setValue(options.color).toRgba(),
      duration: (options.duration ?? 0) / 1000 / 2,
      ease: options.easing ?? "linear",
      onUpdate: () => {
        this.color = {
          r: color.r * 255,
          g: color.g * 255,
          b: color.b * 255,
          a: color.a,
        }
      },
      repeat: 1
    }).yoyo(true)
  },
} as Drawable;


