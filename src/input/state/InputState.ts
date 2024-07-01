import { MouseState } from './MouseState';
import { KeyboardState } from './KeyboardState';
import { TouchState } from './TouchState';

export class InputState {
  readonly mouse = new MouseState();
  readonly keyboard = new KeyboardState();
  readonly touch = new TouchState();
}
