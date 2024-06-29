import { Vec2 } from '../../math';
import type { GameHost } from '../../platform/GameHost';
import { MouseButton } from '../state/MouseButton';
import type { IInput } from '../stateChanges/IInput';
import { MouseButtonInput } from '../stateChanges/MouseButtonInput';
import { MousePositionAbsoluteInput } from '../stateChanges/MousePositionAbsoluteInput';
import { MouseScrollRelativeInput } from '../stateChanges/MouseScrollRelativeInput';
import { InputHandler } from './InputHandler';

export class MouseHandler extends InputHandler {
  override initialize(host: GameHost): boolean {
    this.enabled.addOnChangeListener(
      (enabled) => {
        if (enabled) {
          // eslint-disable-next-line prettier/prettier
          host.renderer.canvas.addEventListener('mousedown', this.#handleMouseDown);
          host.renderer.canvas.addEventListener('mouseup', this.#handleMouseUp);
          host.renderer.canvas.addEventListener('mousemove', this.#handleMouseMove);
          host.renderer.canvas.addEventListener('mouseleave', this.#handleMouseLeave);
          host.renderer.canvas.addEventListener('wheel', this.#handleWheel);
        } else {
          host.renderer.canvas.removeEventListener('mousedown', this.#handleMouseDown);
          host.renderer.canvas.removeEventListener('mouseup', this.#handleMouseUp);
          host.renderer.canvas.removeEventListener('mousemove', this.#handleMouseMove);
          host.renderer.canvas.removeEventListener('mouseleave', this.#handleMouseLeave);
          host.renderer.canvas.removeEventListener('wheel', this.#handleWheel);
        }
      },
      { immediate: true },
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

  #handleMouseDown = (event: MouseEvent) => {
    const button = this.#getMouseButton(event);

    if (button === null) return;

    this.#enqueueInput(MouseButtonInput.create(button, true));
  };

  #handleMouseUp = (event: MouseEvent) => {
    const button = this.#getMouseButton(event);

    if (button === null) return;

    this.#enqueueInput(MouseButtonInput.create(button, false));
  };

  #handleMouseLeave = (event: MouseEvent) => {};

  #handleMouseMove = (event: MouseEvent | PointerEvent) => {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const index = this.pendingInputs.findIndex((it) => it instanceof MousePositionAbsoluteInput);
    if (index !== -1) {
      // We only want to keep the most recent mouse position
      this.pendingInputs.splice(index, 1);
    }

    this.#enqueueInput(new MousePositionAbsoluteInput(new Vec2(x, y)));
  };

  #enqueueInput(input: IInput) {
    this.pendingInputs.push(input);
  }

  override dispose(): void {
    super.dispose();
    this.enabled.value = false;
  }

  #handleWheel = (event: WheelEvent) => {
    this.#enqueueInput(new MouseScrollRelativeInput(new Vec2(event.deltaX, event.deltaY), false));
  };
}
