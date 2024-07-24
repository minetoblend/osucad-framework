import gsap from 'gsap';
import type { IVec2 } from '../math';
import { Color, type ColorSource } from '../pixi';
import { type Drawable } from './drawables/Drawable';

export interface AnimationMixins {
  fadeTo(options: FadeOptions): void;
  fadeOut(options?: AnimationOptions): void;
  fadeIn(options?: AnimationOptions): void;
  moveTo(options: MoveToOptions): void;
  rotateTo(options: RotateToOptions): void;
  fadeColorTo(options: FadeColorToOptions): void;
  flashColorTo(options: FadeColorToOptions): void;
  scaleTo(options: ScaleToOptions): void;
  animateTo(options: AnimateToOptions): void;
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

export type ScaleToOptions = AnimationOptions &
  (
    | {
        scale: number | IVec2;
      }
    | {
        scaleX?: number;
        scaleY?: number;
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

export interface AnimateToOptions extends AnimationOptions {
  position?: IVec2;
  rotation?: number;
  alpha?: number;
  scale?: number | IVec2;
  color?: ColorSource;
}

export const animationMixins: Partial<Drawable> = {
  fadeTo(options: FadeOptions) {
    gsap.killTweensOf(this, 'alpha');
    if (!options.duration) {
      this.alpha = options.alpha;
      return;
    }

    gsap.to(this, {
      alpha: options.alpha,
      duration: (options.duration ?? 0) / 1000,
      ease: options.easing ?? 'linear',
    });
  },
  fadeOut(options: AnimationOptions = {}) {
    this.fadeTo({ ...options, alpha: 0 });
  },
  fadeIn(options: AnimationOptions = {}) {
    this.alpha = 0;
    this.fadeTo({ ...options, alpha: 1 });
  },
  moveTo(options: MoveToOptions) {
    if ('position' in options) {
      gsap.to(this, {
        x: options.position.x,
        y: options.position.y,
        duration: (options.duration ?? 0) / 1000,
        ease: options.easing ?? 'linear',
      });
    } else {
      const gsapOptions: gsap.TweenVars = {
        duration: (options.duration ?? 0) / 1000,
        ease: options.easing ?? 'linear',
      };

      if ('x' in options) gsapOptions.x = options.x;
      if ('y' in options) gsapOptions.y = options.y;

      gsap.to(this, gsapOptions);
    }
  },
  rotateTo(options: RotateToOptions) {
    if ('rotation' in options) {
      gsap.to(this, {
        rotation: options.rotation,
        duration: (options.duration ?? 0) / 1000,
        ease: options.easing ?? 'linear',
      });
    } else {
      gsap.to(this, {
        rotation: (options.angleDegress * Math.PI) / 180,
        duration: (options.duration ?? 0) / 1000,
        ease: options.easing ?? 'linear',
      });
    }
  },
  fadeColorTo(options: FadeColorToOptions) {
    (this as any)['_color'] ??= this.color.toRgba();
    const color = (this as any)['_color'];

    gsap
      .to(color, {
        ...Color.shared.setValue(options.color).toRgba(),
        duration: (options.duration ?? 0) / 1000 / 2,
        ease: options.easing ?? 'linear',
        onUpdate: () => {
          this.color = {
            r: color.r * 255,
            g: color.g * 255,
            b: color.b * 255,
            a: color.a,
          };
        },
      })
      .yoyo(true);
  },
  flashColorTo(options: FadeColorToOptions) {
    (this as any)['_color'] ??= this.color.toRgba();
    const color = (this as any)['_color'];

    gsap
      .to(color, {
        ...Color.shared.setValue(options.color).toRgba(),
        duration: (options.duration ?? 0) / 1000 / 2,
        ease: options.easing ?? 'linear',
        onUpdate: () => {
          this.color = {
            r: color.r * 255,
            g: color.g * 255,
            b: color.b * 255,
            a: color.a,
          };
        },
        repeat: 1,
      })
      .yoyo(true);
  },
  scaleTo(options: ScaleToOptions) {
    let scaleX: number | undefined;
    let scaleY: number | undefined;

    if ('scale' in options) {
      scaleX = typeof options.scale === 'number' ? options.scale : options.scale.x;
      scaleY = typeof options.scale === 'number' ? options.scale : options.scale.y;
    } else {
      scaleX = options.scaleX;
      scaleY = options.scaleY;
    }

    const gsapOptions: gsap.TweenVars = {
      duration: (options.duration ?? 0) / 1000,
      ease: options.easing ?? 'linear',
    };

    if (scaleX !== undefined) gsapOptions.scaleX = scaleX;
    if (scaleY !== undefined) gsapOptions.scaleY = scaleY;

    gsap.to(this, gsapOptions);
  },
  animateTo(options: AnimateToOptions) {
    const { duration, easing } = options;

    if (options.position !== undefined) {
      this.moveTo({ position: options.position, duration, easing });
    }

    if (options.rotation !== undefined) {
      this.rotateTo({ rotation: options.rotation, duration, easing });
    }

    if (options.alpha !== undefined) {
      this.fadeTo({ alpha: options.alpha, duration, easing });
    }

    if (options.scale !== undefined) {
      this.scaleTo({ scale: options.scale, duration, easing });
    }

    if (options.color !== undefined) {
      this.fadeColorTo({ color: options.color, duration, easing });
    }
  },
} as Drawable;
