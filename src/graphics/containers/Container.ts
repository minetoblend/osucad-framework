import {
  CompositeDrawable,
  type CompositeDrawableOptions,
} from "./CompositeDrawable";
import type { Drawable } from "../drawables/Drawable";

export interface ContainerOptions extends CompositeDrawableOptions {
  children?: Drawable[];
  child?: Drawable;
}

export class Container extends CompositeDrawable {

  constructor(options: ContainerOptions = {}) {
    super();
    this.apply(options);
  }

  static create(options: ContainerOptions = {}): Container {
    return new Container().apply(options);
  }

  override apply(options: ContainerOptions): this {
    const { children, child, ...rest } = options;
    super.apply(rest);

    if (child && children) {
      throw new Error("Cannot set both child and children");
    }

    if (child) {
      this.child = child;
    }

    if (children) {
      this.addAll(...children);
    }

    return this;
  }

  get content(): Container {
    return this;
  }

  get children(): Drawable[] {
    if (this.content === this) {
      return this.internalChildren;
    }
    return this.content.children;
  }

  add<T extends Drawable>(child: T): T | undefined {
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

  clear() {
    // TODO
  }

  get child(): Drawable {
    if (this.children.length !== 1) {
      throw new Error("Cannot get child when there are multiple children");
    }

    return this.children[0];
  }

  set child(child: Drawable) {
    if (this.isDisposed) return;

    this.clear();
    this.add(child);
  }
}
