import { UIEvent } from './UIEvent';
import type { InputState } from '../state/InputState.ts';

export class DropEvent extends UIEvent {
  constructor(
    state: InputState,
    readonly files: FileList,
  ) {
    super(state, 'onDrop');
  }
}
