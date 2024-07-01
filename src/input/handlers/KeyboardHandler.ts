import type { GameHost } from '../../platform/GameHost';
import { Key } from '../state/Key';
import type { IInput } from '../stateChanges/IInput';
import { KeyboardKeyInput } from '../stateChanges/KeyboardKeyInput';
import { InputHandler } from './InputHandler';

export class KeyboardHandler extends InputHandler {
  override initialize(host: GameHost): boolean {
    if (!super.initialize(host)) {
      return false;
    }

    this.enabled.addOnChangeListener(
      (enabled) => {
        if (enabled) {
          window.addEventListener('keydown', this.#handleKeyDown);
          window.addEventListener('keyup', this.#handleKeyUp);
        } else {
          window.removeEventListener('keydown', this.#handleKeyDown);
          window.removeEventListener('keyup', this.#handleKeyUp);
        }
      },
      { immediate: true },
    );

    return true;
  }

  #getKey(event: KeyboardEvent): Key | null {
    const key = Key[event.code as keyof typeof Key];

    if (key === undefined) {
      return null;
    }

    return key;
  }

  #handleKeyDown = (event: KeyboardEvent) => {
    event.preventDefault();

    if (event.repeat) return;

    const key = this.#getKey(event);

    if (key !== null) {
      this.#enqueueInput(KeyboardKeyInput.create(key, true));
    }
  };

  #handleKeyUp = (event: KeyboardEvent) => {
    event.preventDefault();

    const key = this.#getKey(event);

    if (key !== null) {
      this.#enqueueInput(KeyboardKeyInput.create(key, false));
    }
  };

  #enqueueInput(input: IInput) {
    this.pendingInputs.push(input);
  }
}
