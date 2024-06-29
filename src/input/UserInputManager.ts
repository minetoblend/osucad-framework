import { InputManager } from './InputManager';
import type { InputHandler } from './handlers/InputHandler';
import { MouseHandler } from './handlers/MouseHandler';

export class UserInputManager extends InputManager {
  override readonly inputHandlers: ReadonlyArray<InputHandler> = [new MouseHandler()];
}
