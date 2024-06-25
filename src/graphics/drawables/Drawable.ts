import { Action } from "../../bindables/Action";
import {
  popDrawableScope,
  pushDrawableScope,
} from "../../bindables/lifetimeScope";
import {
  DependencyContainer,
  type ReadonlyDependencyContainer,
} from "../../di/DependencyContainer";
import type { IInputReceiver } from "../../input/IInputReceiver";
import type { InputManager } from "../../input/InputManager";
import type { ClickEvent } from "../../input/events/ClickEvent";
import type { DragEndEvent } from "../../input/events/DragEndEvent";
import type { DragEvent } from "../../input/events/DragEvent";
import type { DragStartEvent } from "../../input/events/DragStartEvent";
import type { HoverEvent } from "../../input/events/HoverEvent";
import type { HoverLostEvent } from "../../input/events/HoverLostEvent";
import type { MouseDownEvent } from "../../input/events/MouseDownEvent";
import type { MouseMoveEvent } from "../../input/events/MouseMoveEvent";
import type { MouseUpEvent } from "../../input/events/MouseUpEvent";
import type { UIEvent } from "../../input/events/UIEvent";
import { Vec2, type IVec2 } from "../../math/Vec2";
import { Color, Filter, PIXIContainer, type ColorSource } from "../../pixi";
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
  tint?: ColorSource;
  relativeSizeAxes?: Axes;
  relativePositionAxes?: Axes;
  anchor?: Anchor;
  origin?: Anchor;
  margin?: MarginPadding | MarginPaddingOptions;
  label?: string;
  filters?: Filter[];
}

export abstract class Drawable implements IDisposable, IInputReceiver {
  constructor() {
    this.addLayout(this.#transformBacking);
    this.addLayout(this.#drawSizeBacking);
  }

  apply(options: DrawableOptions): this {
    Object.assign(this, options);
    return this;
  }

  label?: string;

  get name() {
    return this.constructor.name;
  }

  //#region drawNode

  abstract createDrawNode(): PIXIContainer;

  #drawNode?: PIXIContainer;

  get drawNode() {
    this.#drawNode ??= this.createDrawNode();
    return this.#drawNode;
  }

  get drawNodePosition(): Vec2 {
    return Vec2.from(this.drawNode.position);
  }

  //#endregion

  //#region position

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

  //#endregion

  //#region size

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

  //#endregion

  //#region scale

  #scale = new Vec2(1);

  get scale(): Readonly<Vec2> {
    return this.#scale;
  }

  set scale(value: IVec2 | number) {
    if (typeof value === "number") value = { x: value, y: value };

    if (this.#scale.equals(value)) return;

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

  //#endregion

  //#region rotation

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

  // endregion

  // region tint & alpha

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

  //#endregion

  //#region layout

  #relativeSizeAxes: Axes = Axes.None;

  get relativeSizeAxes() {
    return this.#relativeSizeAxes;
  }

  set relativeSizeAxes(value: Axes) {
    if (this.#relativeSizeAxes === value) return;

    this.#relativeSizeAxes = value;

    if (this.width === 0) this.width = 1;
    if (this.height === 0) this.height = 1;

    this.invalidate(Invalidation.DrawSize);
  }

  #relativePositionAxes: Axes = Axes.None;

  get relativePositionAxes() {
    return this.#relativePositionAxes;
  }

  set relativePositionAxes(value: Axes) {
    this.#relativePositionAxes = value;
  }

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

  #margin: MarginPadding = new MarginPadding();

  get margin(): MarginPadding {
    return this.#margin;
  }

  set margin(value: MarginPadding | MarginPaddingOptions) {
    this.#margin = MarginPadding.from(value);
  }

  //#endregion

  //#region computed layout properties

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

  get #relativeToAbsoluteFactor(): Vec2 {
    return this.parent?.relativeToAbsoluteFactor ?? new Vec2(1);
  }

  //#endregion

  //#region filters

  get filters(): Filter[] {
    return this.drawNode.filters as Filter[];
  }

  set filters(value: Filter[]) {
    this.drawNode.filters = value;
  }

  //#endregion

  //#region lifecycle

  #loadState: LoadState = LoadState.NotLoaded;

  get loadState() {
    return this.#loadState;
  }

  dependencies!: ReadonlyDependencyContainer;

  removeFromParent(dispose = true) {
    this.parent?.["removeInternal"]?.(this, dispose);
  }

  #completeLoading() {
    this.#loadState = LoadState.Loaded;
    this.onLoadComplete();
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

  onLoad() {}

  onLoadComplete() {}

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

  onDispose(callback: () => void): void {
    this.#onDispose.push(callback);
  }

  withScope<T>(callback: () => T): T {
    try {
      pushDrawableScope(this);
      return callback();
    } finally {
      popDrawableScope();
    }
  }

  //#endregion

  //#region parent

  #parent: CompositeDrawable | null = null;

  get parent() {
    return this.#parent;
  }

  set parent(value: CompositeDrawable | null) {
    this.#parent = value;
  }

  findClosestParent<T extends Drawable>(
    predicate: (d: Drawable) => d is T
  ): T | null {
    let parent = this.parent;

    while (parent) {
      if (predicate(parent)) {
        return parent;
      }

      parent = parent.parent;
    }

    return null;
  }

  findClosestParentOfType<T extends Drawable>(
    type: abstract new () => T
  ): T | null {
    let parent = this.parent;

    while (parent) {
      if (parent instanceof type) {
        return parent;
      }

      parent = parent.parent;
    }

    return null;
  }

  isRootedAt(parent: CompositeDrawable): boolean {
    let current: Drawable | null = this;

    while (current) {
      if (current === parent) {
        return true;
      }

      current = current.parent;
    }

    return false;
  }

  //#endregion

  //#region update & invalidation

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

    if (this.onInvalidate(invalidation, source)) {
      anyInvalidated = true;
    }

    return anyInvalidated;
  }

  readonly invalidated = new Action<[Drawable, Invalidation]>();

  get invalidationFromParentSize(): Invalidation {
    if (this.relativeSizeAxes === Axes.None) {
      return Invalidation.None;
    }
    return Invalidation.DrawSize;
  }

  onInvalidate(
    invalidation: Invalidation,
    source: InvalidationSource
  ): boolean {
    return false;
  }

  validateSuperTree(invalidation: Invalidation) {
    if (this.#invalidationState.validate(invalidation)) {
      this.parent?.validateSuperTree(invalidation);
    }
  }

  //#endregion

  //#region input

  get handlePositionalInput() {
    return true;
  }

  get propagatePositionalInputSubTree() {
    return true;
  }

  receivePositionalInputAt(screenSpacePosition: Vec2): boolean {
    return this.contains(screenSpacePosition);
  }

  toLocalSpace(screenSpacePosition: Vec2): Vec2 {
    return Vec2.from(this.drawNode.toLocal(screenSpacePosition));
  }

  contains(screenSpacePosition: Vec2): boolean {
    const pos = this.toLocalSpace(screenSpacePosition);

    return (
      pos.x >= 0 &&
      pos.x <= this.drawSize.x &&
      pos.y >= 0 &&
      pos.y <= this.drawSize.y
    );
  }

  getContainingInputManager(): InputManager | null {
    return this.findClosestParent((d): d is InputManager => {
      return !!("isInputManager" in d && d.isInputManager);
    });
  }

  buildPositionalInputQueue(screenSpacePos: Vec2, queue: Drawable[]): boolean {
    if (!this.propagatePositionalInputSubTree) return false;

    if (
      this.handlePositionalInput &&
      this.receivePositionalInputAt(screenSpacePos)
    ) {
      queue.push(this);
    }

    return true;
  }

  get handleNonPositionalInput() {
    return true;
  }

  get propagateNonPositionalInputSubTree() {
    return true;
  }

  buildNonPositionalInputQueue(queue: Drawable[], allowBlocking = true) {
    if (!this.propagateNonPositionalInputSubTree) return false;

    if (this.handleNonPositionalInput) queue.push(this);

    return true;
  }

  triggerEvent(e: UIEvent): boolean {
    return this[e.handler](e as any);
  }

  handle(e: UIEvent) {
    return false;
  }

  onMouseDown(e: MouseDownEvent): boolean {
    return this.handle(e);
  }

  onMouseUp(e: MouseUpEvent): boolean {
    return this.handle(e);
  }

  onClick(e: ClickEvent): boolean {
    return this.handle(e);
  }

  onDrag(e: DragEvent): boolean {
    return this.handle(e);
  }

  onDragStart(e: DragStartEvent): boolean {
    return this.handle(e);
  }

  onDragEnd(e: DragEndEvent): boolean {
    return this.handle(e);
  }

  onMouseMove(e: MouseMoveEvent): boolean {
    return this.handle(e);
  }

  onHover(e: HoverEvent): boolean {
    return this.handle(e);
  }

  onHoverLost(e: HoverLostEvent): boolean {
    return this.handle(e);
  }

  get dragBlocksClick() {
    return false;
  }

  isHovered = false;

  isDragged = false;

  //#endregion
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
  Parent = 1 << 3,

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
