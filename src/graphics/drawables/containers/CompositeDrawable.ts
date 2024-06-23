import { Vec2 } from "../../../math/Vec2";
import { PIXIContainer } from "../../../pixi";
import { debugAssert } from "../../../utils/debugAssert";
import { Axes } from "../Axes";
import {
  Drawable,
  Invalidation,
  InvalidationSource,
  LoadState,
  type DrawableOptions,
} from "../Drawable";
import { LayoutMember } from "../LayoutMember";
import { MarginPadding, type MarginPaddingOptions } from "../MarginPadding";

export interface CompositeDrawableOptions extends DrawableOptions {
  padding?: MarginPaddingOptions;
}

export class CompositeDrawable extends Drawable {
  override createDrawNode(): PIXIContainer {
    return new PIXIContainer();
  }

  protected internalChildren: Drawable[] = [];

  protected addInternal<T extends Drawable>(child: T): T {
    this.internalChildren.push(child);
    this.drawNode?.addChild(child.drawNode);
    child.parent = this;

    if(this.loadState >= LoadState.Loading) {
      this.#loadChild(child);
    }

    return child;
  }

  #loadChild(child: Drawable) {
    debugAssert(this.loadState >= LoadState.Loading, "Cannot load child before parent is loaded")

    if(child.loadState < LoadState.Loading) {
      child.load(this.dependencies);
    }
  }

  override onLoad() {
    for(const child of this.internalChildren) {
      this.#loadChild(child);
    }
  }

  protected addAllInternal(...children: Drawable[]): this {
    for (const child of children) {
      this.addInternal(child);
    }
    return this;
  }

  protected removeInternal(child: Drawable, dispose: boolean = true): boolean {
    const index = this.internalChildren.indexOf(child);
    if (index !== -1) {
      this.internalChildren.splice(index, 1);
      this.drawNode?.removeChild(child.drawNode);
      child.parent = null;
      if (dispose) {
        child.dispose();
      }
      return true;
    }
    return false;
  }

  get childSize(): Vec2 {
    return this.drawSize.sub(this.padding.total);
  }

  get relativeToAbsoluteFactor() {
    return this.childSize;
  }

  override get width() {
    return super.width;
  }

  override set width(value: number) {
    super.width = value;
    this.#invalidateChildSize(Invalidation.DrawSize);
  }

  #invalidateChildSize(invalidation: Invalidation) {
    this.invalidate(invalidation);
    for (const child of this.internalChildren) {
      child.invalidate(
        invalidation | child.invalidationFromParentSize,
        InvalidationSource.Parent
      );
    }
  }

  override onInvalidate(invalidation: Invalidation): boolean {
    let anyInvalidated = super.onInvalidate(invalidation);
    if (invalidation & Invalidation.DrawSize) {
      for (const child of this.internalChildren) {
        if (
          child.invalidate(
            child.invalidationFromParentSize,
            InvalidationSource.Parent
          )
        ) {
          anyInvalidated = true;
        }
      }
    }
    return anyInvalidated;
  }

  #padding: MarginPadding = new MarginPadding();

  get padding(): MarginPadding {
    return this.#padding;
  }

  set padding(value: MarginPaddingOptions | undefined) {
    if (this.#padding === value) return;
    
    this.#padding = MarginPadding.from(value);
    
    for (const c of this.internalChildren)
    c.invalidate(c.invalidationFromParentSize | Invalidation.Transform);
  }

  get childOffset(): Vec2 {
    return new Vec2(
      this.padding.left,
      this.padding.top
    );
  }

  #autoSizeAxes: Axes = Axes.None;

  get autoSizeAxes(): Axes {
    return this.#autoSizeAxes;
  }

  #childrenSizeDependencies = new LayoutMember(Invalidation.RequiredParentSizeToFit /* | Invalidation.Presence*/, InvalidationSource.Child);

  invalidateChildrenSizeDependencies(invalidation: Invalidation, axes: Axes, source: Drawable) {
    let wasValid = this.#childrenSizeDependencies.isValid;

    // The invalidation still needs to occur as normal, since a derived CompositeDrawable may want to respond to children size invalidations.
    this.invalidate(invalidation, InvalidationSource.Child);

    // Skip axes that are bypassed.
    axes &= ~source.bypassAutoSizeAxes;

    // Include only axes that this composite is autosizing for.
    axes &= this.autoSizeAxes;

    // If no remaining axes remain, then children size dependencies can immediately be re-validated as the auto-sized size would not change.
    if (wasValid && axes == Axes.None)
        this.#childrenSizeDependencies.validate();
  }

  override updateSubTree() {
    super.updateSubTree();

    for (const child of this.internalChildren) {
      child.updateSubTree();
    }
  }
}
