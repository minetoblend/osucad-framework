import { Vec2, type IVec2 } from '../../math/Vec2';
import { PIXIContainer } from '../../pixi';
import { debugAssert } from '../../utils/debugAssert';
import { Axes } from '../drawables/Axes';
import {
  Drawable,
  Invalidation,
  InvalidationSource,
  LoadState,
  loadDrawable,
  type DrawableOptions,
} from '../drawables/Drawable';
import { LayoutMember } from '../drawables/LayoutMember';
import { MarginPadding, type MarginPaddingOptions } from '../drawables/MarginPadding';
import gsap from 'gsap';

export interface CompositeDrawableOptions extends DrawableOptions {
  padding?: MarginPaddingOptions;
  autoSizeAxes?: Axes;
}

export class CompositeDrawable extends Drawable {
  constructor() {
    super();
    this.addLayout(this.#childrenSizeDependencies);
  }

  override createDrawNode(): PIXIContainer {
    return new PIXIContainer();
  }

  protected internalChildren: Drawable[] = [];

  protected aliveInternalChildren: Drawable[] = [];

  #currentChildId = 0;

  protected addInternal<T extends Drawable>(drawable: T) {
    if (this.isDisposed) {
      return;
    }

    if (drawable.childId !== 0) {
      throw new Error('May not add a drawable to multiple containers.');
    }

    drawable.childId = ++this.#currentChildId;
    //TODO: drawable.removeCompletedTransforms = removeCompletedTransforms;

    if (this.loadState >= LoadState.Loading) {
      this.#loadChild(drawable);
    }

    this.internalChildren.push(drawable);

    if (this.autoSizeAxes !== Axes.None)
      this.invalidate(Invalidation.RequiredParentSizeToFit, InvalidationSource.Child);

    return drawable;
  }

  #loadChild(child: Drawable) {
    if (this.isDisposed) return;

    loadDrawable(child, this.clock, this.dependencies);
    child.parent = this;
  }

  override onLoad() {
    for (const child of this.internalChildren) {
      this.#loadChild(child);
    }
  }

  protected addAllInternal(...children: Drawable[]): this {
    for (const child of children) {
      this.addInternal(child);
    }
    return this;
  }

  protected removeInternal(drawable: Drawable, disposeImmediately: boolean = true): boolean {
    try {
      const index = this.internalChildren.indexOf(drawable);
      if (index < 0) return false;

      this.internalChildren.splice(index, 1);

      if (drawable.isAlive) {
        const aliveIndex = this.aliveInternalChildren.indexOf(drawable);
        debugAssert(aliveIndex >= 0, 'Drawable is alive but not in aliveInternalChildren');
        this.aliveInternalChildren.splice(aliveIndex, 1);

        // TODO: this.childDied?.emit(drawable);
      }

      drawable.parent = null;
      drawable.isAlive = false;
      this.drawNode?.removeChild(drawable.drawNode);

      if (this.autoSizeAxes !== Axes.None) {
        this.invalidate(Invalidation.RequiredParentSizeToFit, InvalidationSource.Child);
      }

      return true;
    } finally {
      if (disposeImmediately) {
        drawable.dispose();
      }
    }
  }

  get childSize(): Vec2 {
    return this.drawSize.sub(this.padding.total);
  }

  #relativeChildSize = new Vec2(1);

  get relativeChildSize(): Vec2 {
    return this.#relativeChildSize;
  }

  protected set relativeChildSize(value: IVec2) {
    if (this.#relativeChildSize.equals(value)) return;

    if (!isFinite(value.x) || !isFinite(value.y)) throw new Error('relativeChildSize must be finite.');
    if (value.x === 0 || value.y === 0) throw new Error('relativeChildSize must be non-zero.');

    this.#relativeChildSize = Vec2.from(value);

    for (const c of this.internalChildren) c.invalidate(c.invalidationFromParentSize);
  }

  get relativeToAbsoluteFactor() {
    return this.childSize.div(this.relativeChildSize);
  }

  override get relativeSizeAxes(): Axes {
    return super.relativeSizeAxes;
  }

  override set relativeSizeAxes(value: Axes) {
    if (value & this.autoSizeAxes) {
      throw new Error('Cannot set relativeSizeAxes to include auto-size axes');
    }
    super.relativeSizeAxes = value;
  }

  override onInvalidate(invalidation: Invalidation, source: InvalidationSource): boolean {
    let anyInvalidated = super.onInvalidate(invalidation, source);

    if (source === InvalidationSource.Child) return anyInvalidated;

    if (invalidation === Invalidation.None) return anyInvalidated;

    if (invalidation & Invalidation.DrawSize) {
      for (const c of this.internalChildren) {
        let childInvalidation = invalidation;

        // Other geometry things like rotation, shearing, etc don't affect child properties.
        childInvalidation &= ~Invalidation.Transform;

        if (c.relativePositionAxes !== Axes.None && (invalidation & Invalidation.DrawSize) > 0)
          childInvalidation |= Invalidation.Transform;

        if (c.relativeSizeAxes === Axes.None) childInvalidation &= ~Invalidation.DrawSize;

        if (c.invalidate(childInvalidation, InvalidationSource.Parent)) {
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

    for (const c of this.internalChildren) c.invalidate(c.invalidationFromParentSize | Invalidation.Transform);
  }

  get childOffset(): Vec2 {
    return new Vec2(this.padding.left, this.padding.top);
  }

  #autoSizeAxes: Axes = Axes.None;

  get autoSizeAxes(): Axes {
    return this.#autoSizeAxes;
  }

  protected set autoSizeAxes(value: Axes) {
    if (value == this.#autoSizeAxes) return;

    if (value & this.relativeSizeAxes) {
      throw new Error('Cannot set autoSizeAxes to include relative size axes');
    }

    this.#autoSizeAxes = value;

    if (value === Axes.None) {
      this.#childrenSizeDependencies.validate();
    } else {
      this.#childrenSizeDependencies.invalidate();
    }

    this.onSizingChanged();
  }

  autoSizeDuration = 0;

  autoSizeEasing: gsap.EaseString | gsap.EaseFunction = 'linear';

  #childrenSizeDependencies = new LayoutMember(
    Invalidation.RequiredParentSizeToFit | Invalidation.Presence,
    InvalidationSource.Child,
  );

  invalidateChildrenSizeDependencies(invalidation: Invalidation, axes: Axes, source: Drawable) {
    const wasValid = this.#childrenSizeDependencies.isValid;

    // The invalidation still needs to occur as normal, since a derived CompositeDrawable may want to respond to children size invalidations.
    this.invalidate(invalidation, InvalidationSource.Child);

    // Skip axes that are bypassed.
    axes &= ~source.bypassAutoSizeAxes;

    // Include only axes that this composite is autosizing for.
    axes &= this.autoSizeAxes;

    // If no remaining axes remain, then children size dependencies can immediately be re-validated as the auto-sized size would not change.
    if (wasValid && axes === Axes.None) this.#childrenSizeDependencies.validate();
  }

  override updateSubTree(): boolean {
    if (!super.updateSubTree()) return false;

    this.updateChildrenLife();

    if (!this.isPresent || !this.requiresChildrenUpdate) return false;

    this.updateAfterChildrenLife();

    for (const child of this.aliveInternalChildren) {
      child.updateSubTree();
    }

    this.updateAfterChildren();

    this.#updateChildrenSizeDependencies();
    this.updateAfterAutoSize();

    return true;
  }

  override updateSubTreeTransforms(): boolean {
    if (!super.updateSubTreeTransforms()) return false;

    for (const child of this.aliveInternalChildren) {
      child.updateSubTreeTransforms();
    }
    return true;
  }

  get requiresChildrenUpdate(): boolean {
    /* TODO: replace with !this.isMaskedAway || !this.#childrenSizeDependencies.isValid*/
    return true;
  }

  updateAfterChildrenLife() {}

  updateAfterChildren() {}

  updateAfterAutoSize() {}

  updateChildrenLife(): boolean {
    if (this.loadState < LoadState.Ready) return false;

    if (!this.checkChildrenLife()) return false;

    return true;
  }

  checkChildrenLife(): boolean {
    let anyAliveChanged = false;

    for (let i = 0; i < this.internalChildren.length; i++) {
      const state = this.#checkChildLife(this.internalChildren[i]);

      anyAliveChanged ||= !!(state & ChildLifeStateChange.MadeAlive || state & ChildLifeStateChange.MadeDead);

      if (state & ChildLifeStateChange.Removed) i--;
    }

    return anyAliveChanged;
  }

  #checkChildLife(child: Drawable): ChildLifeStateChange {
    let state = ChildLifeStateChange.None;

    if (child.shouldBeAlive) {
      if (!child.isAlive) {
        if (child.loadState < LoadState.Ready) {
          // If we're already loaded, we can eagerly allow children to be loaded
          this.#loadChild(child);
          if (child.loadState < LoadState.Ready) return ChildLifeStateChange.None;
        }

        this.makeChildAlive(child);
        state = ChildLifeStateChange.MadeAlive;
      }
    } else {
      if (child.isAlive || child.removeWhenNotAlive) {
        if (this.makeChildDead(child)) state |= ChildLifeStateChange.Removed;

        state |= ChildLifeStateChange.MadeDead;
      }
    }

    return state;
  }

  override buildPositionalInputQueue(screenSpacePos: Vec2, queue: Drawable[]): boolean {
    if (!super.buildPositionalInputQueue(screenSpacePos, queue)) return false;

    for (const child of this.internalChildren) {
      child.buildPositionalInputQueue(screenSpacePos, queue);
    }

    return true;
  }

  makeChildAlive(child: Drawable) {
    debugAssert(!child.isAlive && child.loadState >= LoadState.Ready);

    if (child.requestsNonPositionalInputSubTree) {
      for (
        let ancestor: CompositeDrawable | null = this;
        ancestor !== null && !ancestor.requestsNonPositionalInputSubTree;
        ancestor = ancestor.parent
      )
        ancestor.requestsNonPositionalInputSubTree = true;
    }

    if (child.requestsPositionalInputSubTree) {
      for (
        let ancestor: CompositeDrawable | null = this;
        ancestor !== null && !ancestor.requestsPositionalInputSubTree;
        ancestor = ancestor.parent
      ) {
        ancestor.requestsPositionalInputSubTree = true;
      }
    }

    this.aliveInternalChildren.push(child);
    child.isAlive = true;

    child.invalidate(Invalidation.Layout, InvalidationSource.Parent);

    this.drawNode.addChild(child.drawNode);

    this.invalidate(Invalidation.Presence, InvalidationSource.Child);
  }

  makeChildDead(child: Drawable): boolean {
    if (child.isAlive) {
      const index = this.aliveInternalChildren.indexOf(child);
      debugAssert(index !== -1, 'Child is alive but not in aliveInternalChildren');
      this.aliveInternalChildren.splice(index, 1);
      child.isAlive = false;

      // ChildDied?.Invoke(child);
    }

    let removed = false;

    if (child.removeWhenNotAlive) {
      this.removeInternal(child, false);

      if (child.disposeOnDeathRemoval) child.dispose();

      removed = true;
    }

    this.invalidate(Invalidation.Presence, InvalidationSource.Child);

    return removed;
  }

  #isComputingChildrenSizeDependencies = false;

  override get width() {
    if (!this.#isComputingChildrenSizeDependencies && this.autoSizeAxes & Axes.X)
      this.#updateChildrenSizeDependencies();
    return super.width;
  }

  override set width(value: number) {
    if (this.autoSizeAxes & Axes.X) throw new Error('Cannot set width on a CompositeDrawable with autoSizeAxes.X');
    super.width = value;
  }

  override get height() {
    if (!this.#isComputingChildrenSizeDependencies && this.autoSizeAxes & Axes.Y)
      this.#updateChildrenSizeDependencies();
    return super.height;
  }

  override set height(value: number) {
    if (this.autoSizeAxes & Axes.Y) throw new Error('Cannot set height on a CompositeDrawable with autoSizeAxes.Y');
    super.height = value;
  }

  override get size(): Vec2 {
    if (!this.#isComputingChildrenSizeDependencies && this.autoSizeAxes != Axes.None)
      this.#updateChildrenSizeDependencies();
    return super.size;
  }

  override set size(value: IVec2) {
    if (this.autoSizeAxes & Axes.Both) throw new Error('Cannot set size on a CompositeDrawable with autoSizeAxes');
    super.size = value;
  }

  #computeAutoSize() {
    const originalPadding = this.padding;
    const originalMargin = this.margin;

    try {
      if (this.autoSizeAxes == Axes.None) return this.drawSize;

      const maxBoundSize = new Vec2();

      this.padding = 0;
      this.margin = 0;

      for (const c of this.aliveInternalChildren) {
        if (!c.isPresent) continue;

        const cBound = c.requiredParentSizeToFit;

        if (!(c.bypassAutoSizeAxes & Axes.X)) maxBoundSize.x = Math.max(maxBoundSize.x, cBound.x);

        if (!(c.bypassAutoSizeAxes & Axes.Y)) maxBoundSize.y = Math.max(maxBoundSize.y, cBound.y);
      }

      if (!(this.autoSizeAxes & Axes.X)) maxBoundSize.x = this.drawSize.x;
      if (!(this.autoSizeAxes & Axes.Y)) maxBoundSize.y = this.drawSize.y;

      return maxBoundSize;
    } finally {
      this.padding = originalPadding;
      this.margin = originalMargin;
    }
  }

  #updateAutoSize() {
    if (this.autoSizeAxes === Axes.None) return;

    const b = this.#computeAutoSize().add(this.padding.total);

    this.#autoSizeResizeTo(
      {
        x: this.autoSizeAxes & Axes.X ? b.x : super.width,
        y: this.autoSizeAxes & Axes.Y ? b.y : super.height,
      },
      this.autoSizeDuration,
      this.autoSizeEasing,
    );

    // TODO: onAutoSize?.emit();
  }

  #updateChildrenSizeDependencies() {
    this.#isComputingChildrenSizeDependencies = true;

    try {
      if (!this.#childrenSizeDependencies.isValid) {
        this.#updateAutoSize();
        this.#childrenSizeDependencies.validate();
      }
    } finally {
      this.#isComputingChildrenSizeDependencies = false;
    }
  }

  #autoSizeResizeTo(size: IVec2, duration: number, easing: gsap.EaseString | gsap.EaseFunction) {
    gsap.killTweensOf(this, 'x,y,width');

    if (duration === 0) {
      this.baseWidth = size.x;
      this.baseHeight = size.y;
    } else {
      gsap.to(this, {
        baseWidth: size.x,
        baseHeight: size.y,
      });
    }
  }

  private get baseWidth() {
    return super.width;
  }

  private set baseWidth(value: number) {
    super.width = value;
  }

  private get baseHeight() {
    return super.height;
  }

  private set baseHeight(value: number) {
    super.height = value;
  }
}

const enum ChildLifeStateChange {
  None = 0,
  MadeAlive = 1 << 0,
  MadeDead = 1 << 1,
  Removed = 1 << 2,
}
