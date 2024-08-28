import type { IDrawablePool } from './IDrawablePool.ts';
import { dependencyLoader } from '../../di';
import { loadSymbol } from '../drawables/loadSymbol.ts';
import { CompositeDrawable } from '../containers';
import type { NoArgsConstructor } from '../../types';
import { LoadState } from '../drawables';
import type { PoolableDrawable } from './PoolableDrawable.ts';

export class DrawablePool<T extends PoolableDrawable> extends CompositeDrawable implements IDrawablePool {
  constructor(drawableClass: NoArgsConstructor<T>, initialSize: number, maximumSize?: number) {
    super();

    this.#drawableClass = drawableClass;
    this.#initialSize = initialSize;
    this.#maximumSize = maximumSize ?? null;
  }

  readonly #drawableClass: NoArgsConstructor<T>;

  readonly #initialSize: number;

  readonly #maximumSize: number | null = null;

  readonly #pool: T[] = [];

  @dependencyLoader()
  [loadSymbol()]() {
    this.#pool.length = this.#initialSize;
    for (let i = 0; i < this.#initialSize; i++) {
      this.#pool[i] = this.#create();
    }

    this.loadComponents(this.#pool);
  }

  return(drawable: PoolableDrawable): void {
    if (!(drawable instanceof this.#drawableClass)) {
      throw new Error(`Invalid type ${drawable.constructor.name}`);
    }

    if (drawable.parent !== null) {
      throw new Error('Drawable was attempted to be returned to pool while still in a hierarchy');
    }

    if (drawable.isInUse) {
      drawable.return();
      return;
    }

    if (this.#maximumSize !== null && this.countAvailable > this.#maximumSize) {
      drawable.setPool(null);

      if (drawable.disposeOnDeathRemoval) {
        drawable.dispose();
        // TODO: disposeChildAsync
      }
    } else {
      this.#pool.push(drawable);
    }

    this.#countInUse--;
  }

  get(setupAction?: (d: T) => void): T {
    if (this.loadState <= LoadState.Loading) {
      throw new Error('DrawablePool must be in a loaded state before retrieving pooled drawables.');
    }

    let drawable = this.#pool.pop();
    if (!drawable) {
      drawable = this.#create();

      if (this.#maximumSize == null || this.#currentPoolSize < this.#maximumSize) {
        this.#currentPoolSize++;
      } else {
        this.#countExcessConstructed++;
      }

      if (this.loadState >= LoadState.Loading) {
        this.loadComponent(drawable);
      }
    }

    this.#countInUse++;

    drawable.assign();
    drawable.lifetimeStart = Number.MIN_VALUE;
    drawable.lifetimeEnd = Number.MAX_VALUE;

    setupAction?.(drawable);

    return drawable;
  }

  protected createNewDrawable() {
    return new this.#drawableClass();
  }

  #create(): T {
    const drawable = this.createNewDrawable();

    drawable.setPool(this);

    return drawable;
  }

  override dispose(isDisposing: boolean = true) {
    for (const p of this.#pool) {
      p.dispose();
    }

    this.#countInUse = 0;
    this.#countExcessConstructed = 0;
    this.#currentPoolSize = 0;

    super.dispose(isDisposing);
  }

  #currentPoolSize = 0;

  get currentPoolSize() {
    return this.#currentPoolSize;
  }

  #countInUse = 0;

  get countInUse() {
    return this.#countInUse;
  }

  #countExcessConstructed = 0;

  get countExcessConstructed() {
    return this.#countExcessConstructed;
  }

  get countAvailable() {
    return this.#pool.length;
  }
}