import type { Vec2 } from '../../math';
import { MousePositionAbsoluteInput } from './MousePositionAbsoluteInput';
import type { TouchStateChangeEvent } from './events/TouchStateChangeEvent';

export class MousePositionAbsoluteInputFromTouch extends MousePositionAbsoluteInput {
  constructor(
    readonly touchEvent: TouchStateChangeEvent,
    position: Vec2,
  ) {
    super(position);
  }
}
