import type { MouseButton } from '../state/MouseButton';
import { ButtonInputEntry } from './ButtonInput';
import { MouseButtonInput } from './MouseButtonInput';
import type { TouchStateChangeEvent } from './events/TouchStateChangeEvent';

export class MouseButtonInputFromTouch extends MouseButtonInput {
  constructor(
    button: MouseButton,
    isPressed: boolean,
    readonly touchEvent: TouchStateChangeEvent,
  ) {
    super([new ButtonInputEntry(button, isPressed)]);
  }
}
