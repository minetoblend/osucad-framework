import type { Drawable } from '../graphics/drawables/Drawable';
import { ButtonEventManager } from './ButtonEventManager';
import type { InputState } from './state/InputState';
import { Key } from './state/Key';
import { KeyDownEvent } from './events/KeyDownEvent';
import { KeyUpEvent } from './events/KeyUpEvent';

export class KeyEventManager extends ButtonEventManager<Key> {
  handleButtonDown(state: InputState, targets: Drawable[]): Drawable | null {
    return this.propagateButtonEvent(targets, new KeyDownEvent(state, this.button));
  }
  handleButtonUp(state: InputState, targets: Drawable[]): void {
    this.propagateButtonEvent(targets, new KeyUpEvent(state, this.button));
  }
}
