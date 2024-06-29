import { Matrix } from "pixi.js";
import { Action } from "../../bindables/Action";
import {
  popDrawableScope,
  pushDrawableScope,
} from "../../bindables/lifetimeScope";
import {
  DependencyContainer,
  type ReadonlyDependencyContainer,
} from "../../di/DependencyContainer";
import { getDependencyLoaders, getInjections } from "../../di/decorators";
import { HandleInputCache } from "../../input/HandleInputCache";
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
import { Quad } from "../../math/Quad";
import { Rectangle } from "../../math/Rectangle";
import { Vec2, type IVec2 } from "../../math/Vec2";
import {
  Color,
  Filter,
  PIXIContainer,
  type BLEND_MODES,
  type ColorSource,
} from "../../pixi";
import type { IFrameBasedClock } from "../../timing/IFrameBasedClock";
import type { IDisposable } from "../../types/IDisposable";
import { almostEquals } from "../../utils/almostEquals";
import { debugAssert } from "../../utils/debugAssert";
import { animationMixins } from "../AnimationMixins";
import type { CompositeDrawable } from "../containers/CompositeDrawable";
import { Anchor } from "./Anchor";
import { Axes } from "./Axes";
import { InvalidationState } from "./InvalidationState";
import { LayoutComputed } from "./LayoutComputed";
import { LayoutMember } from "./LayoutMember";
import { MarginPadding, type MarginPaddingOptions } from "./MarginPadding";
import type { FrameTimeInfo } from "../../timing";
import gsap from "gsap";

export interface DrawableOptions {
  position?: IVec2;
  x?: number;
  y?: number;
  size?: IVec2 | number;
  width?: number;
  height?: number;
  rotation?: number;
  alpha?: number;
  color?: ColorSource;
  tint?: ColorSource;
  relativeSizeAxes?: Axes;
  relativePositionAxes?: Axes;
  anchor?: Anchor;
  origin?: Anchor;
  margin?: MarginPadding | MarginPaddingOptions;
  label?: string;
  filters?: Filter[];
  blendMode?: BLEND_MODES;
}

export const LOAD = Symbol("load");

export interface Drawable extends OsucadFrameworkMixins.Drawable {}

export abstract class Drawable implements IDisposable, IInputReceiver {
  constructor() {
    this.addLayout(this.#transformBacking);
    this.addLayout(this.#drawSizeBacking);
    this.addLayout(this.#colorBacking);
    this.addLayout(this.#requiredParentSizeToFitBacking);
  }

  apply(options: DrawableOptions): this {
    Object.assign(this, options);
    return this;
  }

  label?: string;

  get name() {
    return this.constructor.name;
  }

  public static mixin(source: Record<string, any>): void {
    Object.defineProperties(
      Drawable.prototype,
      Object.getOwnPropertyDescriptors(source)
    );
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

    const wasPresent = this.isPresent;

    this.#scale.x = value.x;
    this.#scale.y = value.y;

    if (this.isPresent !== wasPresent) {
      this.invalidate(Invalidation.Transform | Invalidation.Presence);
    } else {
      this.invalidate(Invalidation.Transform);
    }
  }

  get drawScale() {
    return this.scale;
  }

  get scaleX() {
    return this.#scale.x;
  }

  set scaleX(value: number) {
    if (this.#scale.x === value) return;

    const wasPresent = this.isPresent;

    this.#scale.x = value;

    if (this.isPresent !== wasPresent) {
      this.invalidate(Invalidation.Transform | Invalidation.Presence);
    } else {
      this.invalidate(Invalidation.Transform);
    }
  }

  get scaleY() {
    return this.#scale.y;
  }

  set scaleY(value: number) {
    if (this.#scale.y === value) return;

    const wasPresent = this.isPresent;

    this.#scale.y = value;

    if (this.isPresent !== wasPresent) {
      this.invalidate(Invalidation.Transform | Invalidation.Presence);
    } else {
      this.invalidate(Invalidation.Transform);
    }
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

  #color: Color = new Color(0xffffff);

  get color(): Color {
    return this.#color;
  }

  set color(value: ColorSource) {
    debugAssert(
      Color.isColorLike(value),
      "color must be a valid color-like value"
    );

    this.#color.setValue(value);

    this.invalidate(Invalidation.Color);
  }

  get tint() {
    return this.#color.toHex();
  }

  set tint(value: ColorSource) {
    debugAssert(
      Color.isColorLike(value),
      "tint must be a valid color-like value"
    );

    const alpha = this.#color.alpha;
    this.#color.setValue(value);
    this.#color.setAlpha(alpha);

    this.invalidate(Invalidation.Color);
  }

  #alpha: number = 1;

  get alpha() {
    return this.#alpha;
  }

  set alpha(value: number) {
    if (this.#alpha === value) return;

    const wasPresent = this.isPresent;

    this.#alpha = value;

    if (this.isPresent !== wasPresent) {
      this.invalidate(Invalidation.Presence | Invalidation.Color);
    } else {
      this.invalidate(Invalidation.Color);
    }
  }

  get blendMode() {
    return this.drawNode.blendMode;
  }

  set blendMode(value: BLEND_MODES) {
    this.drawNode.blendMode = value;
  }

  get isPresent() {
    return (
      this.alwaysPresent ||
      (this.alpha > 0.0001 && this.drawScale.x !== 0 && this.drawScale.y !== 0)
    );
  }

  #alwaysPresent: boolean = false;

  get alwaysPresent() {
    return this.#alwaysPresent;
  }

  set alwaysPresent(value: boolean) {
    if (this.#alwaysPresent === value) return;

    const wasPresent = this.isPresent;

    this.#alwaysPresent = value;

    if (this.isPresent !== wasPresent) {
      this.invalidate(Invalidation.Presence);
    }
  }

  //#endregion

  //#region layout

  onSizingChanged() {}

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

    this.#updateBypassAutoSizeAxes();

    this.onSizingChanged();
  }

  #relativePositionAxes: Axes = Axes.None;

  get relativePositionAxes() {
    return this.#relativePositionAxes;
  }

  set relativePositionAxes(value: Axes) {
    if (this.#relativePositionAxes === value) return;

    const conversion = this.#relativeToAbsoluteFactor;

    if ((value & Axes.X) > (this.#relativePositionAxes & Axes.X))
      this.x = almostEquals(conversion.x, 0) ? 0 : this.x / conversion.x;
    else if ((this.#relativePositionAxes & Axes.X) > (value & Axes.X))
      this.x *= conversion.x;

    if ((value & Axes.Y) > (this.#relativePositionAxes & Axes.Y))
      this.y = almostEquals(conversion.y, 0) ? 0 : this.y / conversion.y;
    else if ((this.#relativePositionAxes & Axes.Y) > (value & Axes.Y))
      this.y *= conversion.y;

    this.#relativePositionAxes = value;

    this.#updateBypassAutoSizeAxes();
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

    return new Vec2(x, y);
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
    Invalidation.Transform |
      Invalidation.RequiredParentSizeToFit |
      Invalidation.Presence
  );

  get drawSize(): Vec2 {
    return this.#drawSizeBacking.value;
  }

  get layoutSize(): Vec2 {
    return this.drawSize.add(this.margin.total);
  }

  get layoutRectangle(): Rectangle {
    return new Rectangle(
      -this.margin.left,
      -this.margin.top,
      this.drawSize.x,
      this.drawSize.y
    );
  }

  get boundingBox(): Rectangle {
    return this.rectToParentSpace(this.layoutRectangle).AABB;
  }

  #requiredParentSizeToFitBacking = new LayoutComputed(() => {
    const ap = this.anchorPosition;
    const rap = this.relativeAnchorPosition;

    const ratio1 = new Vec2(
      rap.x <= 0 ? 0 : 1 / rap.x,
      rap.y <= 0 ? 0 : 1 / rap.y
    );

    const ratio2 = new Vec2(
      rap.x >= 1 ? 0 : 1 / (1 - rap.x),
      rap.y >= 1 ? 0 : 1 / (1 - rap.y)
    );

    const bbox = this.boundingBox;

    const topLeftOffset = ap.sub(bbox.topLeft);
    const topLeftSize1 = topLeftOffset.mul(ratio1);
    const topLeftSize2 = topLeftOffset.mulF(-1).mul(ratio2);

    const bottomRightOffset = ap.sub(bbox.bottomRight);
    const bottomRightSize1 = bottomRightOffset.mul(ratio1);
    const bottomRightSize2 = bottomRightOffset.mulF(-1).mul(ratio2);

    return topLeftSize1
      .componentMax(topLeftSize2)
      .componentMax(bottomRightSize1)
      .componentMax(bottomRightSize2);
  }, Invalidation.RequiredParentSizeToFit);

  get requiredParentSizeToFit(): Vec2 {
    return this.#requiredParentSizeToFitBacking.value;
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

  lifetimeChanged = new Action<Drawable>();

  get lifetimeStart() {
    return this.#lifeTimeStart;
  }

  set lifetimeStart(value: number) {
    if (this.#lifeTimeStart === value) return;

    this.#lifeTimeStart = value;
    this.lifetimeChanged.emit(this);
  }

  get lifetimeEnd() {
    return this.#lifeTimeEnd;
  }

  set lifetimeEnd(value: number) {
    if (this.#lifeTimeEnd === value) return;

    this.#lifeTimeEnd = value;
    this.lifetimeChanged.emit(this);
  }

  #lifeTimeStart = -Infinity;

  #lifeTimeEnd = Infinity;

  isAlive = false;

  get shouldBeAlive() {
    if (this.lifetimeStart == -Infinity && this.lifetimeEnd === Infinity)
      return true;

    return (
      this.time.current >= this.lifetimeStart &&
      this.time.current < this.lifetimeEnd
    );
  }

  get removeWhenNotAlive() {
    return this.parent === null || this.time.current > this.lifetimeStart;
  }

  get disposeOnDeathRemoval() {
    // TODO: return this.removeCompletedTransforms
    return true;
  }

  #loadState: LoadState = LoadState.NotLoaded;

  get loadState() {
    return this.#loadState;
  }

  dependencies!: DependencyContainer;

  removeFromParent(dispose = true) {
    this.parent?.["removeInternal"]?.(this, dispose);
  }

  #loadComplete() {
    this.#loadState = LoadState.Loaded;
    this.onLoadComplete();
  }

  [LOAD](clock: IFrameBasedClock, dependencies: ReadonlyDependencyContainer) {
    try {
      this.updateClock(clock);

      pushDrawableScope(this);
      this.#loadState = LoadState.Loading;

      this.requestsNonPositionalInput =
        HandleInputCache.requestsNonPositionalInput(this);
      this.requestsPositionalInput =
        HandleInputCache.requestsPositionalInput(this);

      this.requestsNonPositionalInputSubTree = this.requestsNonPositionalInput;
      this.requestsPositionalInputSubTree = this.requestsPositionalInput;

      this.#injectDependencies(dependencies);
      this.onLoad();
      const dependencyLoaders = getDependencyLoaders(this);
      for (const key of dependencyLoaders) {
        (this as any)[key]();
      }

      this.#loadState = LoadState.Ready;
    } finally {
      popDrawableScope();
    }
  }

  #clock!: IFrameBasedClock;

  #customClock?: IFrameBasedClock;

  processCustomClock = true;

  get clock() {
    if (!this.#clock) throw new Error("Drawable is not loaded");
    return this.#clock;
  }

  set clock(value: IFrameBasedClock) {
    this.#customClock = value;
    this.updateClock(value);
  }

  get time(): FrameTimeInfo {
    return this.#clock.timeInfo;
  }

  expire(calculateLifetimeStart: boolean = false) {
    if (this.#clock === null) {
      this.lifetimeEnd = -Infinity;
      return;
    }

    const tweens = gsap.getTweensOf(this);

    this.lifetimeEnd =
      this.time.current +
      tweens.reduce(
        (max, t) => Math.max(max, (t.totalDuration() - t.time()) * 1000),
        -Infinity
      );

    console.log(this.lifetimeEnd - this.clock.currentTime);

    if (calculateLifetimeStart) {
      let min = Infinity;

      for (const t of tweens) {
        if (t.time() < min) min = t.time();
      }

      min *= 1000;
      min += this.time.current;

      this.lifetimeStart = min < Infinity ? min : -Infinity;
    }
  }

  updateClock(clock: IFrameBasedClock) {
    this.#clock = this.#customClock ?? clock;
  }

  onLoad() {}

  onLoadComplete() {}

  #injectDependencies(dependencies: ReadonlyDependencyContainer) {
    this.dependencies = new DependencyContainer(dependencies);

    const injections = getInjections(this);
    for (const { key, type, optional } of injections) {
      Reflect.set(
        this,
        key,
        optional
          ? this.dependencies.resolveOptional(type)
          : this.dependencies.resolve(type)
      );
    }
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

  #bypassAutoSizeAxes: Axes = Axes.None;

  #bypassAutoSizeAdditionalAxes: Axes = Axes.None;

  get bypassAutoSizeAxes(): Axes {
    return this.#bypassAutoSizeAxes;
  }

  set bypassAutoSizeAxes(value: Axes) {
    this.#bypassAutoSizeAdditionalAxes = value;
    this.#updateBypassAutoSizeAxes();
  }

  #updateBypassAutoSizeAxes() {
    const value =
      this.relativePositionAxes |
      this.relativeSizeAxes |
      this.#bypassAutoSizeAdditionalAxes;

    if (this.#bypassAutoSizeAxes !== value) {
      var changedAxes = this.#bypassAutoSizeAxes ^ value;
      this.#bypassAutoSizeAxes = value;
      if ((this.parent?.autoSizeAxes ?? 0) & changedAxes)
        this.parent?.invalidate(
          Invalidation.RequiredParentSizeToFit,
          InvalidationSource.Child
        );
    }
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

  childId = 0;

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

  updateSubTree(): boolean {
    if (this.isDisposed) {
      throw new Error("Cannot update disposed drawable");
    }

    if (this.processCustomClock) this.#customClock?.processFrame();

    if (this.loadState < LoadState.Ready) return false;

    if (this.loadState === LoadState.Ready) {
      this.#loadComplete();
    }

    if (!this.isPresent) {
      return true;
    }

    this.update();

    return true;
  }

  updateSubTreeTransforms(): boolean {
    if (!this.isPresent) return false;

    if (!this.#transformBacking.isValid) {
      this.updateDrawNodeTransform();
      this.#transformBacking.validate();
    }

    if (!this.#colorBacking.isValid) {
      this.updateDrawNodeColor();
      this.#colorBacking.validate();
    }

    return true;
  }

  update() {}

  #transformBacking = new LayoutMember(
    Invalidation.Transform | Invalidation.DrawSize | Invalidation.Presence
  );

  #colorBacking = new LayoutMember(Invalidation.Color);

  updateDrawNodeTransform() {
    let pos = this.drawPosition.add(this.anchorPosition);

    if (this.parent) {
      pos = pos.add(this.parent.childOffset);
    }

    this.drawNode.position.copyFrom(pos);
    this.drawNode.pivot.copyFrom(this.originPosition);
    this.drawNode.scale.copyFrom(this.drawScale);
    this.drawNode.rotation = this.rotation;
  }

  updateDrawNodeColor() {
    this.drawNode.alpha = this.alpha * this.#color.alpha;
    this.drawNode.tint = this.tint;
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

  get localTransform() {
    const transform = new Matrix();
    let pos = this.drawPosition.add(this.anchorPosition);

    if (this.parent) {
      pos = pos.add(this.parent.childOffset);
    }

    transform.translate(pos.x, pos.y);
    transform.scale(this.scale.x, this.scale.y);
    transform.rotate(this.rotation);

    transform.translate(-this.originPosition.x, -this.originPosition.y);

    return transform;
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

  requestsNonPositionalInput: boolean = false;

  requestsPositionalInput: boolean = false;

  requestsNonPositionalInputSubTree: boolean = false;

  requestsPositionalInputSubTree: boolean = false;

  get handlePositionalInput() {
    return this.requestsPositionalInput;
  }

  get propagatePositionalInputSubTree() {
    return this.isPresent && this.requestsPositionalInputSubTree;
  }

  receivePositionalInputAt(screenSpacePosition: Vec2): boolean {
    return this.contains(screenSpacePosition);
  }

  toLocalSpace(screenSpacePosition: Vec2): Vec2 {
    return Vec2.from(this.drawNode.toLocal(screenSpacePosition));
  }

  toScreenSpace(localSpacePosition: Vec2): Vec2 {
    return Vec2.from(this.drawNode.toGlobal(localSpacePosition));
  }

  rectToParentSpace(rect: Rectangle): Quad {
    return Quad.fromRectangle(rect).transform(this.localTransform);
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
    return this.requestsNonPositionalInput;
  }

  get propagateNonPositionalInputSubTree() {
    return this.isPresent && this.requestsNonPositionalInputSubTree;
  }

  buildNonPositionalInputQueue(queue: Drawable[], allowBlocking = true) {
    if (!this.propagateNonPositionalInputSubTree) return false;

    if (this.handleNonPositionalInput) queue.push(this);

    return true;
  }

  triggerEvent(e: UIEvent): boolean {
    return this[e.handler]?.(e as any) ?? this.handle(e);
  }

  get requiresHighFrequencyMousePosition() {
    return false;
  }

  handle(e: UIEvent) {
    return false;
  }

  onMouseDown?(e: MouseDownEvent): boolean;

  onMouseUp?(e: MouseUpEvent): boolean;

  onClick?(e: ClickEvent): boolean;

  onDrag?(e: DragEvent): boolean;

  onDragStart?(e: DragStartEvent): boolean;

  onDragEnd?(e: DragEndEvent): boolean;

  onMouseMove?(e: MouseMoveEvent): boolean;

  onHover?(e: HoverEvent): boolean;

  onHoverLost?(e: HoverLostEvent): boolean;

  get dragBlocksClick() {
    return true;
  }

  isHovered = false;

  isDragged = false;

  //#endregion
}

export function loadDrawable(
  drawable: Drawable,
  clock: IFrameBasedClock,
  dependencies: ReadonlyDependencyContainer
) {
  drawable[LOAD](clock, dependencies);
}

export enum LoadState {
  NotLoaded,
  Loading,
  Ready,
  Loaded,
}

export enum Invalidation {
  Transform = 1,
  DrawSize = 1 << 1,
  Color = 1 << 2,
  Presence = 1 << 3,
  Parent = 1 << 4,

  Layout = Transform | DrawSize,
  RequiredParentSizeToFit = Transform | DrawSize,
  All = Transform | RequiredParentSizeToFit | Color | Presence,
  None = 0,
}

export const enum InvalidationSource {
  Self = 1,
  Parent = 1 << 1,
  Child = 1 << 2,
  Default = Self | Parent,
}

Drawable.mixin(animationMixins);
