import type { InputState } from '../../state/InputState.ts';
import { InputStateChangeEvent } from './InputStateChangeEvent.ts';
import type { FileDropInput } from '../FileDropInput.ts';

export class DropStateChangeEvent extends InputStateChangeEvent {
  constructor(state: InputState, input: FileDropInput) {
    super(state, input);

    this.files = input.files;
  }

  readonly files: FileList;
}
