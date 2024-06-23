import { Action } from "../../bindables/Action";
import {
  popDrawableScope,
  pushDrawableScope,
} from "../../bindables/lifetimeScope";
import {
  DependencyContainer,
  type ReadonlyDependencyContainer,
} from "../../di/DependencyContainer";
import { Vec2, type IVec2 } from "../../math/Vec2";
import { Color, PIXIContainer, type ColorSource } from "../../pixi";
import type { IDisposable } from "../../types/IDisposable";
import { debugAssert } from "../../utils/debugAssert";
import { Anchor } from "./Anchor";
import { Axes } from "./Axes";
import { InvalidationState } from "./InvalidationState";
import { LayoutComputed } from "./LayoutComputed";
import { LayoutMember } from "./LayoutMember";
import { MarginPadding, type MarginPaddingOptions } from "./MarginPadding";
import type { CompositeDrawable } from "./containers/CompositeDrawable";

export interface DrawableOptions {
  position?: IVec2;
  x?: number;
  y?: number;
  size?: IVec2 | number;
  width?: number;
  height?: number;
  rotation?: number;
  alpha?: number;
  tint?: number;
  relativeSizeAxes?: Axes;
  relativePositionAxes?: Axes;
  anchor?: Anchor;
  origin?: Anchor;
  margin?: MarginPadding | MarginPaddingOptions;
  label?: string;
}

export abstract class Drawable implements IDisposable {
  constructor() {
    this.#drawNode = this.createDrawNode();
    this.addLayout(this.#transformBacking);
    this.addLayout(this.#drawSizeBacking);
  }

  onClick = new Action<MouseEvent>();

  apply(options: DrawableOptions): this {
    Object.assign(this, options);
    return this;
  }

  abstract createDrawNode(): PIXIContainer;

  label?: string;

  #drawNode?: PIXIContainer;

  get drawNode() {
    if (!this.#drawNode) {
      throw new Error("Drawable not loaded");
    }
    return this.#drawNode;
  }

  #x: number = 0;

  get x() {
    return this.#x;
  }

  set x(value: number) {
    if (this.#x === value) return;

    debugAssert(isFinite(value), "x must be finite");

    this.#x = value;
    this.invalidate(Invalidation.Transform);
  }

  #y: number = 0;

  get y() {
    return this.#y;
  }

  set y(value: number) {
    if (this.#y === value) return;

    debugAssert(isFinite(value), "y must be finite");

    this.#y = value;
    this.invalidate(Invalidation.Transform);
  }

  get position(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  set position(value: IVec2) {
    if (this.x === value.x && this.y === value.y) return;

    debugAssert(isFinite(value.x), "x must be finite");
    debugAssert(isFinite(value.y), "y must be finite");

    this.#x = value.x;
    this.#y = value.y;

    this.invalidate(Invalidation.Transform);
  }

  #width: number = 0;

  get width() {
    return this.#width;
  }

  set width(value: number) {
    if (this.#width === value) return;

    debugAssert(isFinite(value), "width must be finite");

    this.#width = value;

    this.#invalidateParentSizeDependencies(Invalidation.DrawSize, Axes.X);
  }

  #height: number = 0;

  get height() {
    return this.#height;
  }

  set height(value: number) {
    if (this.#height === value) return;

    debugAssert(isFinite(value), "height must be finite");

    this.#height = value;

    this.invalidate(Invalidation.DrawSize);
  }

  get size(): Vec2 {
    return new Vec2(this.width, this.height);
  }

  set size(value: IVec2 | number) {
    // TODO: optimize this

    if (typeof value === "number") {
      this.width = value;
      this.height = value;
    } else {
      this.width = value.x;
      this.height = value.y;
    }
  }

  #scale = new Vec2(1);

  get scale(): Readonly<Vec2> {
    return this.#scale;
  }

  set scale(value: IVec2) {
    if(this.#scale.equals(value)) return;

    this.#scale.x = value.x;
    this.#scale.y = value.y;

    this.invalidate(Invalidation.Transform);
  }

  get scaleX() {
    return this.#scale.x;
  }

  set scaleX(value: number) {
    if (this.#scale.x === value) return;

    this.#scale.x = value;

    this.invalidate(Invalidation.Transform);
  }

  get scaleY() {
    return this.#scale.y;
  }

  set scaleY(value: number) {
    if (this.#scale.y === value) return;

    this.#scale.y = value;

    this.invalidate(Invalidation.Transform);
  }

  #rotation: number = 0;

  get rotation() {
    return this.#rotation;
  }

  set rotation(value: number) {
    if (this.#rotation === value) return;

    debugAssert(isFinite(value), "rotation must be finite");

    this.#rotation = value;
    this.invalidate(Invalidation.Transform);
  }

  get tint() {
    return this.drawNode.tint;
  }

  set tint(value: ColorSource) {
    debugAssert(
      Color.isColorLike(value),
      "tint must be a valid color-like value"
    );

    this.drawNode.tint = value;
  }

  #alpha: number = 1;

  get alpha() {
    return this.#alpha;
  }

  set alpha(value: number) {
    this.#alpha = value;
  }

  #relativeSizeAxes: Axes = Axes.None;

  get relativeSizeAxes() {
    return this.#relativeSizeAxes;
  }

  set relativeSizeAxes(value: Axes) {
    if (this.#relativeSizeAxes === value) return;

    this.#relativeSizeAxes = value;

    this.invalidate(Invalidation.DrawSize);
  }

  #relativePositionAxes: Axes = Axes.None;

  get relativePositionAxes() {
    return this.#relativePositionAxes;
  }

  set relativePositionAxes(value: Axes) {
    this.#relativePositionAxes = value;
  }

  get drawPosition(): Vec2 {
    const position = this.applyRelativeAxes(
      this.relativePositionAxes,
      this.position
    );

    return position.add({
      x: this.margin.left,
      y: this.margin.top,
    });
  }

  #drawSizeBacking = new LayoutComputed(
    () => this.applyRelativeAxes(this.relativeSizeAxes, this.size),
    Invalidation.Transform | Invalidation.RequiredParentSizeToFit
  );

  get drawSize(): Vec2 {
    return this.#drawSizeBacking.value;
  }

  get layoutSize(): Vec2 {
    return this.drawSize.add(this.margin.total);
  }

  get requiredParentSizeToFit(): Vec2 {
    const v = this.layoutSize;

    if (this.relativeSizeAxes & Axes.X) {
      v.x = 0;
    } else if (this.relativeSizeAxes & Axes.Y) {
      v.y = 0;
    }

    return v;
  }

  #margin: MarginPadding = new MarginPadding();

  get margin(): MarginPadding {
    return this.#margin;
  }

  set margin(value: MarginPadding | MarginPaddingOptions) {
    this.#margin = MarginPadding.from(value);
  }

  #anchor: Anchor = Anchor.TopLeft;

  get anchor(): Anchor {
    return this.#anchor;
  }

  set anchor(value: Anchor) {
    if (this.#anchor === value) return;

    this.#anchor = value;

    this.invalidate(Invalidation.Transform);
  }

  get relativeAnchorPosition(): Vec2 {
    const v = Vec2.zero();

    if (this.#anchor & Anchor.x1) {
      v.x = 0.5;
    } else if (this.#anchor & Anchor.x2) {
      v.x = 1;
    }

    if (this.#anchor & Anchor.y1) {
      v.y = 0.5;
    } else if (this.#anchor & Anchor.y2) {
      v.y = 1;
    }

    return v;
  }

  get anchorPosition(): Vec2 {
    if (this.parent) {
      return this.relativeAnchorPosition.mul(this.parent.childSize);
    }

    return this.relativeAnchorPosition;
  }

  #origin: Anchor = Anchor.TopLeft;

  get origin(): Anchor {
    return this.#origin;
  }

  set origin(value: Anchor) {
    if (this.#origin === value) return;

    this.#origin = value;

    this.invalidate(Invalidation.Transform);
  }

  get relativeOriginPosition(): Vec2 {
    const v = Vec2.zero();

    if (this.#origin & Anchor.x1) {
      v.x = 0.5;
    } else if (this.#origin & Anchor.x2) {
      v.x = 1;
    }

    if (this.#origin & Anchor.y1) {
      v.y = 0.5;
    } else if (this.#origin & Anchor.y2) {
      v.y = 1;
    }

    return v;
  }

  get originPosition() {
    return this.relativeOriginPosition.mul(this.drawSize);
  }

  // region lifecycle
  #loadState: LoadState = LoadState.NotLoaded;

  get loadState() {
    return this.#loadState;
  }

  dependencies!: ReadonlyDependencyContainer;

  removeFromParent(dispose = true) {
    this.parent?.["removeInternal"]?.(this, dispose);
  }

  load(dependencies: ReadonlyDependencyContainer) {
    try {
      pushDrawableScope(this);
      this.#loadState = LoadState.Loading;
      this.#injectDependencies(dependencies);
      this.onLoad();
      this.#loadState = LoadState.Ready;
    } finally {
      popDrawableScope();
    }
  }

  #injectDependencies(dependencies: ReadonlyDependencyContainer) {
    this.dependencies = new DependencyContainer(dependencies);
  }

  #isDisposed: boolean = false;

  get isDisposed() {
    return this.#isDisposed;
  }

  dispose(): boolean {
    if (this.isDisposed) return false;

    debugAssert(!this.parent, "Cannot dispose drawable with parent");

    this.drawNode?.destroy({ children: true });
    for (const callback of this.#onDispose) {
      callback();
    }

    this.#isDisposed = true;
    return true;
  }

  #onDispose: (() => void)[] = [];

  #invalidateParentSizeDependencies(
    invalidation: Invalidation,
    changedAxes: Axes
  ) {
    this.invalidate(invalidation, InvalidationSource.Self, false);

    this.parent?.invalidateChildrenSizeDependencies(
      invalidation,
      changedAxes,
      this
    );
  }

  get bypassAutoSizeAxes(): Axes {
    let axes = Axes.None;
    if (this.relativeSizeAxes & Axes.X) {
      axes |= Axes.X;
    }
    if (this.relativeSizeAxes & Axes.Y) {
      axes |= Axes.Y;
    }

    return axes;
  }

  findClosestParentOfType<T extends Drawable>(type: new () => T): T | null {
    let parent = this.parent;

    while (parent) {
      if (parent instanceof type) {
        return parent;
      }

      parent = parent.parent;
    }

    return null;
  }

  onDispose(callback: () => void): void {
    this.#onDispose.push(callback);
  }

  // endregion

  get drawNodePosition(): Vec2 {
    return Vec2.from(this.drawNode.position);
  }

  // region parent

  #parent: CompositeDrawable | null = null;

  get parent() {
    return this.#parent;
  }

  set parent(value: CompositeDrawable | null) {
    this.#parent = value;
  }

  get #relativeToAbsoluteFactor(): Vec2 {
    return this.parent?.relativeToAbsoluteFactor ?? new Vec2(1);
  }

  // endregion

  updateSubTree() {
    debugAssert(
      this.loadState >= LoadState.Ready,
      `Cannot update ${this.name} before ready`
    );

    if (this.loadState === LoadState.Ready) {
      this.#completeLoading();
    }

    if (!this.#transformBacking.isValid) {
      this.updateDrawNodeTransform();
      this.#transformBacking.validate();
    }

    this.update();
  }

  get name() {
    return this.constructor.name;
  }

  update() {}

  #transformBacking = new LayoutMember(
    Invalidation.Transform | Invalidation.DrawSize
  );

  updateDrawNodeTransform() {
    let pos = this.drawPosition.add(this.anchorPosition);

    if (this.parent) {
      pos = pos.add(this.parent.childOffset);
    }

    this.drawNode.position.copyFrom(pos);
    this.drawNode.pivot.copyFrom(this.originPosition);
    this.drawNode.scale.copyFrom(this.scale);
    this.drawNode.rotation = this.rotation;
  }

  #completeLoading() {
    this.#loadState = LoadState.Loaded;
    this.onLoadComplete();
  }

  onLoad() {}

  onLoadComplete() {}

  // region invalidation

  #invalidationState = new InvalidationState(Invalidation.All);

  #layoutMembers: LayoutMember[] = [];

  addLayout(layout: LayoutMember) {
    layout.parent = this;
    this.#layoutMembers.push(layout);
  }

  invalidate(
    invalidation: Invalidation,
    source: InvalidationSource = InvalidationSource.Self,
    propagateToParent: boolean = true
  ): boolean {
    if (propagateToParent && source === InvalidationSource.Self) {
      this.parent?.invalidate(invalidation, InvalidationSource.Child);
    }

    if (!this.#invalidationState.invalidate(invalidation, source)) {
      return false;
    }

    let anyInvalidated = false;

    for (const layout of this.#layoutMembers) {
      if (!(source & layout.source)) {
        continue;
      }

      if (layout.invalidation & invalidation) {
        if (layout.isValid) {
          layout.invalidate();
          anyInvalidated = true;
        }
      }
    }

    if (this.onInvalidate(invalidation)) {
      anyInvalidated = true;
    }

    return anyInvalidated;
  }

  get invalidationFromParentSize(): Invalidation {
    if (this.relativeSizeAxes === Axes.None) {
      return Invalidation.None;
    }
    return Invalidation.DrawSize;
  }

  withLifetimeScope<T>(callback: () => T): T {
    try {
      pushDrawableScope(this);
      return callback();
    } finally {
      popDrawableScope();
    }
  }

  // @ts-expect-error unused parameter
  onInvalidate(invalidation: Invalidation): boolean {
    return false;
  }

  validateSuperTree(invalidation: Invalidation) {
    if (this.#invalidationState.validate(invalidation)) {
      this.parent?.validateSuperTree(invalidation);
    }
  }

  // endregion

  protected applyRelativeAxes(axes: Axes, v: Readonly<Vec2>): Readonly<Vec2> {
    if (axes === Axes.None) {
      return v;
    }

    let x = v.x;
    let y = v.y;

    const conversion = this.#relativeToAbsoluteFactor;

    if (axes & Axes.X) {
      x *= conversion.x;
    }

    if (axes & Axes.Y) {
      y *= conversion.y;
    }

    return new Vec2(x, y).readonly();
  }
}

export const enum LoadState {
  NotLoaded,
  Loading,
  Ready,
  Loaded,
}

export const enum Invalidation {
  Transform = 1,
  DrawSize = 1 << 1,
  Color = 1 << 2,

  Layout = Transform | DrawSize,
  RequiredParentSizeToFit = Transform | DrawSize,
  All = Layout | Color,
  None = 0,
}

export const enum InvalidationSource {
  Self = 1,
  Parent = 1 << 1,
  Child = 1 << 2,
  Default = Self | Parent,
}
