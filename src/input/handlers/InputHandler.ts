import { Bindable } from '../../bindables/Bindable';
import type { GameHost } from '../../platform/GameHost';
import type { IDisposable } from '../../types/IDisposable';
import type { IInput } from '../stateChanges/IInput';

export abstract class InputHandler implements IDisposable {
  abstract initialize(host: GameHost): boolean;

  readonly enabled = new Bindable(true);

  #isDisposed: boolean = false;

  protected pendingInputs: IInput[] = [];

  get isDisposed() {
    return this.#isDisposed;
  }

  dispose(): void {
    this.#isDisposed = true;
  }

  collectPendingInputs(inputs: IInput[]): void {
    inputs.push(...this.pendingInputs);
    this.pendingInputs.length = 0;
  }
}
