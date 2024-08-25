import type { IDisposable } from './IDisposable.ts';

export interface IUsable extends IDisposable {
  use(block: () => void): void;
}

export abstract class Usable implements IUsable {
  use(block: () => void): void {
    try {
      block();
    } finally {
      this.dispose();
    }
  }

  abstract dispose(): void;
}

export class ValueInvokeOnDisposal extends Usable {
  constructor(dispose: () => void) {
    super();
    this.#dispose = dispose;
  }

  readonly #dispose: () => void;

  dispose() {
    this.#dispose();
  }
}
