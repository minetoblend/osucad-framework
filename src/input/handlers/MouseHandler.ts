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
    if (!super.initialize(host)) {
      return false;
    }

    this.enabled.addOnChangeListener(
      (enabled) => {
        if (enabled) {
          // eslint-disable-next-line prettier/prettier
          host.renderer.canvas.addEventListener('pointerdown', this.#handleMouseDown);
          host.renderer.canvas.addEventListener('pointerup', this.#handleMouseUp);
          host.renderer.canvas.addEventListener('pointermove', this.#handleMouseMove);
          host.renderer.canvas.addEventListener('mouseleave', this.#handleMouseLeave);
          host.renderer.canvas.addEventListener('wheel', this.#handleWheel);
        } else {
          host.renderer.canvas.removeEventListener('pointerdown', this.#handleMouseDown);
          host.renderer.canvas.removeEventListener('pointerup', this.#handleMouseUp);
          host.renderer.canvas.removeEventListener('pointermove', this.#handleMouseMove);
          host.renderer.canvas.removeEventListener('mouseleave', this.#handleMouseLeave);
          host.renderer.canvas.removeEventListener('wheel', this.#handleWheel);
        }
      },
      { immediate: true },
    );

    this.#host = host;

    return true;
  }

  #host!: GameHost;

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

  #handleMouseDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;

    event.preventDefault();

    this.#host.renderer.canvas.setPointerCapture(event.pointerId);

    const button = this.#getMouseButton(event);

    if (button === null) return;

    this.#enqueueInput(MouseButtonInput.create(button, true));
  };

  #handleMouseUp = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;

    event.preventDefault();

    this.#host.renderer.canvas.releasePointerCapture(event.pointerId);

    const button = this.#getMouseButton(event);

    if (button === null) return;

    this.#enqueueInput(MouseButtonInput.create(button, false));
  };

  #handleMouseLeave = (event: MouseEvent) => {};

  #handleMouseMove = (event: MouseEvent | PointerEvent) => {
    event.preventDefault();

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
    event.preventDefault();
    this.#enqueueInput(new MouseScrollRelativeInput(new Vec2(event.deltaX, event.deltaY), false));
  };
}
