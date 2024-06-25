import { Axes } from "../graphics/drawables/Axes";
import type { Drawable } from "../graphics/drawables/Drawable";
import { Container } from "../graphics/drawables/containers/Container";
import type { Vec2 } from "../math";
import { WebGameHost } from "../platform/WebGameHost";
import { MouseButtonEventManager } from "./MouseButtonEventManager";
import { HoverEvent } from "./events/HoverEvent";
import { HoverLostEvent } from "./events/HoverLostEvent";
import { MouseMoveEvent } from "./events/MouseMoveEvent";
import type { UIEvent } from "./events/UIEvent";
import type { InputHandler } from "./handlers/InputHandler";
import { InputState } from "./state/InputState";
import { MouseButton } from "./state/MouseButton";
import { MouseState } from "./state/MouseState";
import type { IInput } from "./stateChanges/IInput";
import type { IInputStateChangeHandler } from "./stateChanges/IInputStateChangeHandler";
import { MouseButtonInput } from "./stateChanges/MouseButtonInput";
import { ButtonStateChangeEvent } from "./stateChanges/events/ButtonStateChangeEvent";
import type { InputStateChangeEvent } from "./stateChanges/events/InputStateChangeEvent";
import { MousePositionChangeEvent } from "./stateChanges/events/MousePositionChangeEvent";

export abstract class InputManager
  extends Container
  implements IInputStateChangeHandler
{
  currentState = new InputState();

  abstract readonly inputHandlers: ReadonlyArray<InputHandler>;

  constructor() {
    super();

    this.relativeSizeAxes = Axes.Both;

    for(const mouseButton of [
      MouseButton.Left,
      MouseButton.Middle,
      MouseButton.Right
    ]) {
      const manager = this.createMouseButtonEventManager(mouseButton);

      manager.inputManager = this;
      manager.getInputQueue = () => this.positionalInputQueue;

      this.#mouseButtonEventManagers[mouseButton] = manager;
    }
  }

  createMouseButtonEventManager(button: MouseButton) {
    if(button === MouseButton.Left) {
      return new MouseLeftButtonEventManager(button);
    }

    return new MouseMinorButtonEventManager(button);
  }

  override onLoad() {
    super.onLoad();

    const host = this.dependencies.resolve(WebGameHost);

    for (const handler of this.inputHandlers) {
      handler.initialize(host);
    }
  }

  isInputManager = true;

  override update(): void {
    this.#inputQueue.length = 0;
    this.#positionalInputQueue.length = 0;

    const pendingInputs = this.getPendingInputs();

    if (pendingInputs.length > 0) {
      this.#lastMouseMove = null;
    }

    for (const result of pendingInputs) {
      result.apply(this.currentState, this);
    }

    if (!this.#hoverEventsUpdated) {
      this.#updateHoverEvents(this.currentState);
    }

    super.update();
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
        if(buttonEvent.input instanceof MouseButtonInput) {
          this.handleMouseButtonStateChange(buttonEvent as ButtonStateChangeEvent<MouseButton>);
        }
        break;
      default:
        console.warn("Unhandled input state change event", event);
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
      (this.#lastMouseMove = new MouseMoveEvent(state, lastPosition))
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
  
  handleMouseButtonStateChange(
    event: ButtonStateChangeEvent<MouseButton>
  ) {
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

  #buildPositionalInputQueue(screenSpacePos: Vec2): Drawable[] {
    this.#positionalInputQueue.length = 0;

    const children = this.internalChildren;
    for (let i = 0; i < children.length; i++) {
      if (this.shouldBeConsideredForInput(children[i]))
        children[i].buildPositionalInputQueue(
          screenSpacePos,
          this.#positionalInputQueue
        );
    }

    this.#positionalInputQueue.reverse();

    return this.#positionalInputQueue;
  }

  shouldBeConsideredForInput(drawable: Drawable) {
    // TODO
    return true;
  }

  override buildPositionalInputQueue(
    screenSpacePos: Vec2,
    queue: Drawable[]
  ): boolean {
    return false;
  }

  propagateBlockableEvent(drawables: Drawable[], e: UIEvent): boolean {
    for (const d of drawables) {
      if (!d.triggerEvent(e)) continue;

      return true;
    }

    return false;
  }
}

class MouseLeftButtonEventManager extends MouseButtonEventManager {
  override get enableClick(): boolean {
    return true;
  }

  override get enableDrag(): boolean {
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
}