import type { InputState } from '../state/InputState';
import type { Key } from '../state/Key';
import { UIEvent } from './UIEvent';

export class KeyDownEvent extends UIEvent {
  constructor(
    state: InputState,
    readonly key: Key,
  ) {
    super(state, 'onKeyDown');
  }
}
