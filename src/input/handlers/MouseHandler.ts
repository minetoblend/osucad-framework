import { Vec2 } from "../../math";
import type { GameHost } from "../../platform/GameHost";
import { MouseButton } from "../state/MouseButton";
import type { IInput } from "../stateChanges/IInput";
import { MouseButtonInput } from "../stateChanges/MouseButtonInput";
import { MousePositionAbsoluteInput } from "../stateChanges/MousePositionAbsoluteInput";
import { InputHandler } from "./InputHandler";

export class MouseHandler extends InputHandler {
  override initialize(host: GameHost): boolean {
    this.enabled.addOnChangeListener(
      (enabled) => {
        if (enabled) {
          host.renderer.canvas.addEventListener("mousedown", this.#mouseDown);
          host.renderer.canvas.addEventListener("mouseup", this.#mouseUp);
          host.renderer.canvas.addEventListener("mousemove", this.#mouseMove);
          host.renderer.canvas.addEventListener("mouseleave", this.#mouseLeave);
        } else {
          host.renderer.canvas.removeEventListener(
            "mousedown",
            this.#mouseDown
          );
          host.renderer.canvas.removeEventListener("mouseup", this.#mouseUp);
          host.renderer.canvas.removeEventListener(
            "mousemove",
            this.#mouseMove
          );
          host.renderer.canvas.removeEventListener(
            "mouseleave",
            this.#mouseLeave
          );
        }
      },
      { immediate: true }
    );

    return true;
  }

  #getMouseButton(event: MouseEvent): MouseButton | null {
    switch (event.button) {
      case 0:
        return MouseButton.Left;
      case 1:
        return MouseButton.Middle;
      case 2:
        return MouseButton.Right;
      default:
        return null;
    }
  }

  #mouseDown = (event: MouseEvent) => {
    const button = this.#getMouseButton(event);

    if (button === null) return;

    this.#enqueueInput(new MouseButtonInput(button, true));
  };

  #mouseUp = (event: MouseEvent) => {
    const button = this.#getMouseButton(event);

    if (button === null) return;

    this.#enqueueInput(new MouseButtonInput(button, false));
  };

  #mouseLeave = (event: MouseEvent) => {};

  #mouseMove = (event: MouseEvent) => {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.#enqueueInput(new MousePositionAbsoluteInput(new Vec2(x, y)));
  };

  #enqueueInput(input: IInput) {
    this.pendingInputs.push(input);
  }

  override dispose(): void {
    super.dispose();
    this.enabled.value = false;
  }
}
