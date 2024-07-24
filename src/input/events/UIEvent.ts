import type { Drawable } from '../../graphics';
import type { IInputReceiver } from '../IInputReceiver';
import type { InputState } from '../state/InputState';
import { Vec2 } from '../../math';

export class UIEvent {
  constructor(
    readonly state: InputState,
    readonly handler: keyof IInputReceiver,
  ) {}

  target: Drawable | null = null;

  get mousePosition(): Vec2 {
    return this.target!.toLocalSpace(this.screenSpaceMousePosition);
  }

  get screenSpaceMousePosition() {
    return this.state.mouse.position;
  }

  get controlPressed() {
    return this.state.keyboard.controlPressed;
  }

  get shiftPressed() {
    return this.state.keyboard.shiftPressed;
  }

  get altPressed() {
    return this.state.keyboard.altPressed;
  }

  get metaPressed() {
    return this.state.keyboard.metaPressed;
  }

  get draggedFiles() {
    return this.state.draggedFiles;
  }
}
