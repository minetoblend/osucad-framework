import type { Drawable } from "../../graphics/drawables/Drawable";
import type { Vec2 } from "../../math";
import type { InputState } from "../state/InputState";
import type { MouseButton } from "../state/MouseButton";
import { UIEvent } from "./UIEvent";

export class DragEvent extends UIEvent {
  constructor(
    state: InputState,
    readonly button: MouseButton,
    readonly screenSpaceMouseDownPosition: Vec2 | null = null,
    screenSpaceLastMousePosition: Vec2 | null = null
  ) {
    super(state, "onDrag");
    this.screenSpaceLastMousePosition =
      screenSpaceLastMousePosition ?? state.mouse.position;
  }

  readonly screenSpaceLastMousePosition: Vec2;

  get screenSpaceDelta(): Vec2 {
    return this.screenSpaceMousePosition.sub(this.screenSpaceLastMousePosition);
  }

  localSpaceDelta(drawable: Drawable): Vec2 {
    const position = drawable.toLocalSpace(this.screenSpaceMousePosition);
    const lastPosition = drawable.toLocalSpace(this.screenSpaceLastMousePosition);

    return position.sub(lastPosition);
  }

  parentSpaceDelta(drawable: Drawable): Vec2 {
    const position = drawable.parent!.toLocalSpace(this.screenSpaceMousePosition);
    const lastPosition = drawable.parent!.toLocalSpace(this.screenSpaceLastMousePosition);

    return position.sub(lastPosition);
  }
}
