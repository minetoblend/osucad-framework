import { resolved } from '../di/decorators';
import { Container } from '../graphics/containers/Container';
import { Axes } from '../graphics/drawables/Axes';
import type { Drawable } from '../graphics/drawables/Drawable';
import { GAME_HOST } from '../injectionTokens';
import type { Vec2 } from '../math';
import type { GameHost } from '../platform/GameHost';
import { debugAssert } from '../utils/debugAssert';
import type { IFocusManager } from './IFocusManager';
import { MouseButtonEventManager } from './MouseButtonEventManager';
import { FocusEvent } from './events/FocusEvent';
import { FocusLostEvent } from './events/FocusLostEvent';
import { HoverEvent } from './events/HoverEvent';
import { HoverLostEvent } from './events/HoverLostEvent';
import { MouseMoveEvent } from './events/MouseMoveEvent';
import { ScrollEvent } from './events/ScrollEvent';
import type { UIEvent } from './events/UIEvent';
import type { InputHandler } from './handlers/InputHandler';
import { InputState } from './state/InputState';
import { MouseButton } from './state/MouseButton';
import type { IInput } from './stateChanges/IInput';
import type { IInputStateChangeHandler } from './stateChanges/IInputStateChangeHandler';
import { MouseButtonInput } from './stateChanges/MouseButtonInput';
import { ButtonStateChangeEvent } from './stateChanges/events/ButtonStateChangeEvent';
import type { InputStateChangeEvent } from './stateChanges/events/InputStateChangeEvent';
import { MousePositionChangeEvent } from './stateChanges/events/MousePositionChangeEvent';
import { MouseScrollChangeEvent } from './stateChanges/events/MouseScrollChangeEvent';

export abstract class InputManager extends Container implements IInputStateChangeHandler, IFocusManager {
  currentState = new InputState();

  abstract inputHandlers: ReadonlyArray<InputHandler>;

  readonly isFocusManger = true;

  constructor() {
    super();

    this.relativeSizeAxes = Axes.Both;

    for (const mouseButton of [MouseButton.Left, MouseButton.Middle, MouseButton.Right]) {
      const manager = this.createMouseButtonEventManager(mouseButton);

      manager.inputManager = this;
      manager.getInputQueue = () => this.positionalInputQueue;

      this.#mouseButtonEventManagers[mouseButton] = manager;
    }
  }

  createMouseButtonEventManager(button: MouseButton) {
    if (button === MouseButton.Left) {
      return new MouseLeftButtonEventManager(button);
    }

    return new MouseMinorButtonEventManager(button);
  }

  getMouseButtonEventManagerFor(button: MouseButton) {
    return this.#mouseButtonEventManagers[button];
  }

  @resolved(GAME_HOST)
  host!: GameHost;

  focusedDrawable: Drawable | null = null;

  override onLoad() {
    super.onLoad();

    for (const handler of this.inputHandlers) {
      handler.initialize(this.host);
    }
  }

  isInputManager = true;

  override update(): void {
    this.#unfocusIfNoLongerValid();
    this.#inputQueue.length = 0;
    this.#positionalInputQueue.length = 0;

    const pendingInputs = this.getPendingInputs();

    if (pendingInputs.length > 0) {
      this.#lastMouseMove = null;
    }

    for (const result of pendingInputs) {
      result.apply(this.currentState, this);
    }

    if (this.currentState.mouse.isPositionValid) {
      debugAssert(this.highFrequencyDrawables.length === 0);
      for (const d of this.positionalInputQueue) {
        if (d.requiresHighFrequencyMousePosition) this.highFrequencyDrawables.push(d);
      }

      if (this.highFrequencyDrawables.length > 0) {
        this.#lastMouseMove ??= new MouseMoveEvent(this.currentState);
        this.propagateBlockableEvent(this.highFrequencyDrawables, this.#lastMouseMove);
      }

      this.highFrequencyDrawables.length = 0;
    }

    if (!this.#hoverEventsUpdated) {
      this.#updateHoverEvents(this.currentState);
    }

    if (this.focusedDrawable === null) {
      this.#focusTopMostRequestingDrawable();
    }

    super.update();
  }

  changeFocus(potentialFocusTarget: Drawable | null, state: InputState = this.currentState): boolean {
    if (potentialFocusTarget === this.focusedDrawable) return true;

    if (
      potentialFocusTarget !== null &&
      (!this.#isDrawableValidForFocus(potentialFocusTarget) || !potentialFocusTarget.acceptsFocus)
    )
      return false;

    const previousFocus = this.focusedDrawable;

    this.focusedDrawable = null;

    if (previousFocus != null) {
      previousFocus.hasFocus = false;
      previousFocus.triggerEvent(new FocusLostEvent(state, potentialFocusTarget));

      if (this.focusedDrawable != null) {
        throw new Error('Focus cannot be changed inside OnFocusLost.');
      }
    }

    this.focusedDrawable = potentialFocusTarget;

    if (this.focusedDrawable != null) {
      this.focusedDrawable.hasFocus = true;
      this.focusedDrawable.triggerEvent(new FocusEvent(state, previousFocus));
    }

    return true;
  }

  #isDrawableValidForFocus(drawable: Drawable): boolean {
    let valid = drawable.isAlive && drawable.isPresent && drawable.parent !== null;

    if (valid) {
      //ensure we are visible
      let d = drawable.parent;

      while (d != null) {
        if (!d.isPresent || !d.isAlive) {
          valid = false;
          break;
        }

        d = d.parent;
      }
    }

    return valid;
  }

  getPendingInputs(): IInput[] {
    const inputs: IInput[] = [];
    for (const h of this.inputHandlers) {
      h.collectPendingInputs(inputs);
    }
    return inputs;
  }

  handleInputStateChange(event: InputStateChangeEvent): void {
    switch (event.constructor) {
      case MousePositionChangeEvent:
        this.handleMousePositionChange(event as MousePositionChangeEvent);
        break;
      case ButtonStateChangeEvent:
        const buttonEvent = event as ButtonStateChangeEvent<any>;
        if (buttonEvent.input instanceof MouseButtonInput) {
          this.handleMouseButtonStateChange(buttonEvent as ButtonStateChangeEvent<MouseButton>);
        }
        break;
      case MouseScrollChangeEvent:
        this.handleMouseScrollChange(event as MouseScrollChangeEvent);
        break;
      default:
        console.warn('Unhandled input state change event', event);
    }
  }

  handleMousePositionChange(event: MousePositionChangeEvent): void {
    const state = event.state;

    this.#handleMouseMove(state, event.lastPosition);

    for (const manager of Object.values(this.#mouseButtonEventManagers))
      manager.handlePositionChange(state, event.lastPosition);

    this.#updateHoverEvents(state);
  }

  #handleMouseMove(state: InputState, lastPosition: Vec2): void {
    this.propagateBlockableEvent(
      this.positionalInputQueue,
      (this.#lastMouseMove = new MouseMoveEvent(state, lastPosition)),
    );
  }

  handleMouseScrollChange(e: MouseScrollChangeEvent): void {
    this.#handleScroll(e.state, e.lastScroll, e.isPrecise);
  }

  #handleScroll(state: InputState, lastScroll: Vec2, isPrecise: boolean): void {
    this.propagateBlockableEvent(
      this.positionalInputQueue,
      new ScrollEvent(state, state.mouse.scroll.sub(lastScroll), isPrecise),
    );
  }

  #hoverHandledDrawable: Drawable | null = null;
  #hoveredDrawables: Drawable[] = [];
  #lastHoverHandledDrawables: Drawable[] = [];

  get handleHoverEvents() {
    return true;
  }

  #updateHoverEvents(state: InputState) {
    const lastHoverHandledDrawable = this.#hoverHandledDrawable;
    this.#hoverHandledDrawable = null;

    this.#lastHoverHandledDrawables = [...this.#hoveredDrawables];

    this.#hoveredDrawables = [];

    if (this.handleHoverEvents) {
      for (const d of this.positionalInputQueue) {
        this.#hoveredDrawables.push(d);
        const index = this.#lastHoverHandledDrawables.indexOf(d);
        if (index !== -1) {
          this.#lastHoverHandledDrawables.splice(index, 1);
        }

        if (d.isHovered) {
          if (d == lastHoverHandledDrawable) {
            this.#hoverHandledDrawable = lastHoverHandledDrawable;
            break;
          }

          continue;
        }

        d.isHovered = true;

        if (d.triggerEvent(new HoverEvent(state))) {
          this.#hoverHandledDrawable = d;
          break;
        }
      }
    }

    // Unhover all previously hovered drawables which are no longer hovered.
    for (const d of this.#lastHoverHandledDrawables) {
      d.isHovered = false;
      d.triggerEvent(new HoverLostEvent(state));
    }

    this.#hoverEventsUpdated = true;
  }

  handleMouseButtonStateChange(event: ButtonStateChangeEvent<MouseButton>) {
    const handler = this.#mouseButtonEventManagers[event.button];
    handler?.handleButtonStateChange(this.currentState, event.kind);
  }

  #mouseButtonEventManagers: Record<MouseButton, MouseButtonEventManager> = {} as any;

  #lastMouseMove: MouseMoveEvent | null = null;
  #hoverEventsUpdated = false;

  #inputQueue: Drawable[] = [];
  #positionalInputQueue: Drawable[] = [];

  get positionalInputQueue(): Drawable[] {
    return this.#buildPositionalInputQueue(this.currentState.mouse.position);
  }

  get nonPositionalInputQueue(): Drawable[] {
    return this.#buildNonPositionalInputQueue();
  }

  #buildPositionalInputQueue(screenSpacePos: Vec2): Drawable[] {
    this.#positionalInputQueue.length = 0;

    const children = this.internalChildren;
    for (let i = 0; i < children.length; i++) {
      if (this.shouldBeConsideredForInput(children[i]))
        children[i].buildPositionalInputQueue(screenSpacePos, this.#positionalInputQueue);
    }

    this.#positionalInputQueue.reverse();

    return this.#positionalInputQueue;
  }

  #buildNonPositionalInputQueue(): Drawable[] {
    this.#inputQueue.length = 0;

    const children = this.aliveInternalChildren;

    for (let i = 0; i < children.length; i++) {
      if (this.shouldBeConsideredForInput(children[i])) {
        children[i].buildNonPositionalInputQueue(this.#inputQueue);
      }
    }

    if (!this.#unfocusIfNoLongerValid()) {
      const index = this.#inputQueue.indexOf(this.focusedDrawable!);
      if (index !== -1 && index !== this.#inputQueue.length - 1) {
        this.#inputQueue.splice(index, 1);
        this.#inputQueue.push(this.focusedDrawable!);
      }
    }

    this.#inputQueue.reverse();

    return this.#inputQueue;
  }

  override buildPositionalInputQueue(screenSpacePos: Vec2, queue: Drawable[]): boolean {
    return false;
  }

  override buildNonPositionalInputQueue(queue: Drawable[], allowBlocking: boolean = true) {
    if (!allowBlocking) super.buildNonPositionalInputQueue(queue, false);

    return false;
  }

  private readonly highFrequencyDrawables: Drawable[] = [];

  propagateBlockableEvent(drawables: Drawable[], e: UIEvent): boolean {
    for (const d of drawables) {
      if (!d.triggerEvent(e)) continue;

      return true;
    }

    return false;
  }

  #unfocusIfNoLongerValid() {
    if (this.focusedDrawable === null) {
      return true;
    }

    if (this.#isDrawableValidForFocus(this.focusedDrawable)) {
      return false;
    }

    this.changeFocus(null);
    return true;
  }

  #focusTopMostRequestingDrawable() {
    for (const d of this.nonPositionalInputQueue) {
      if (d.requestsFocus) {
        this.changeFocus(d);
        return;
      }
    }

    this.changeFocus(null);
  }

  changeFocusFromClick(clickedDrawable: Drawable | null) {
    let focusTarget: Drawable | null = null;
    if (clickedDrawable !== null) {
      focusTarget = clickedDrawable;

      if (!focusTarget.acceptsFocus) {
        // search upwards from the clicked drawable until we find something to handle focus.
        const previousFocused = this.focusedDrawable;

        while (focusTarget?.acceptsFocus === false) {
          focusTarget = focusTarget.parent;
        }

        if (focusTarget !== null && previousFocused !== null) {
          // we found a focusable target above us.
          // now search upwards from previousFocused to check whether focusTarget is a common parent.
          let search: Drawable | null = previousFocused;
          while (search !== null && search !== focusTarget) {
            search = search.parent;
          }

          if (focusTarget === search)
            // we have a common parent, so let's keep focus on the previously focused target.
            focusTarget = previousFocused;
        }
      }
    }

    this.changeFocus(focusTarget);
  }
}

class MouseLeftButtonEventManager extends MouseButtonEventManager {
  override get enableClick(): boolean {
    return true;
  }

  override get enableDrag(): boolean {
    return true;
  }

  override get changeFocusOnClick(): boolean {
    return true;
  }
}

class MouseMinorButtonEventManager extends MouseButtonEventManager {
  override get enableClick(): boolean {
    return false;
  }

  override get enableDrag(): boolean {
    return false;
  }

  override get changeFocusOnClick(): boolean {
    return false;
  }
}
