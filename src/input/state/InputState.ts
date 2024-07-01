import { MouseState } from './MouseState';
import { KeyboardState } from './KeyboardState';

export class InputState {
  readonly mouse = new MouseState();
  readonly keyboard = new KeyboardState();
}
