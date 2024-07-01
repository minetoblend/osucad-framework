import { InputManager } from './InputManager';
import type { InputHandler } from './handlers/InputHandler';

export class UserInputManager extends InputManager {
  get inputHandlers(): ReadonlyArray<InputHandler> {
    return this.host.availableInputHandlers;
  }
}
