import type { Drawable } from '../graphics/drawables/Drawable';
import type { IInputReceiver } from './IInputReceiver';

type DrawableConstructor = new (...args: any[]) => Drawable;

export class HandleInputCache {
  private static positionalCachedValudes = new Map<DrawableConstructor, boolean>();
  private static nonPositionalCachedValues = new Map<DrawableConstructor, boolean>();

  static requestsNonPositionalInput(drawable: Drawable): boolean {
    return this.getViaReflection(drawable, this.nonPositionalCachedValues, false);
  }

  static requestsPositionalInput(drawable: Drawable): boolean {
    return this.getViaReflection(drawable, this.positionalCachedValudes, true);
  }

  private static getViaReflection(
    drawable: Drawable,
    cache: Map<DrawableConstructor, boolean>,
    positional: boolean,
  ): boolean {
    const cached = cache.get(drawable.constructor as DrawableConstructor);
    if (cached !== undefined) {
      return cached;
    }

    const value = this.computeViaReflection(drawable, positional);
    cache.set(drawable.constructor as DrawableConstructor, value);

    return value;
  }

  private static readonly nonPositionalInputMethods: (keyof IInputReceiver)[] = ['onKeyDown', 'onKeyUp'];

  private static readonly positionalInputMethods: (keyof IInputReceiver)[] = [
    'onMouseDown',
    'onMouseUp',
    'onClick',
    'onMouseMove',
    'onHover',
    'onHoverLost',
    'onDragStart',
    'onDrag',
    'onDragEnd',
    'onScroll',
    'onFocus',
    'onFocusLost',
  ];

  private static computeViaReflection(drawable: Drawable, positional: boolean): boolean {
    const inputMethods = positional ? this.positionalInputMethods : this.nonPositionalInputMethods;

    for (const method of inputMethods) {
      if (method in drawable) {
        return true;
      }
    }

    return false;
  }
}
