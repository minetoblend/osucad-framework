import {
  CompositeDrawable,
  type CompositeDrawableOptions,
} from "./CompositeDrawable";
import type { Drawable } from "../Drawable";

export interface ContainerOptions extends CompositeDrawableOptions {
  children?: Drawable[];
  child?: Drawable;
}

export class Container extends CompositeDrawable {
  static create(options: ContainerOptions = {}): Container {
    return new Container().apply(options);
  }

  override apply(options: ContainerOptions): this {
    const { children, child, ...rest } = options;
    super.apply(rest);
    if (child && children) {
      throw new Error("Cannot set both child and children");
    }
    if (children) {
      for (const child of children) {
        this.add(child);
      }
    }
    if (child) {
      this.add(child);
    }

    return this;
  }

  get content(): Container {
    return this;
  }

  get children(): Drawable[]{
    if (this.content === this) {
      return this.internalChildren;
    }
    return this.content.children;
  }

  add<T extends Drawable>(child: T): T {
    if (this.content === this) {
      return this.addInternal(child);
    } else {
      return this.content.add(child);
    }
  }

  addAll(...children: Drawable[]): this {
    for (const child of children) {
      this.add(child);
    }
    return this;
  }

  remove(child: Drawable): boolean {
    if (this.content === this) {
      return this.removeInternal(child);
    } else {
      return this.content.remove(child);
    }
  }
}
