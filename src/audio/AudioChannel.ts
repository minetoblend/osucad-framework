import type { IDisposable } from "../types";

export class AudioChannel implements IDisposable {
  constructor(readonly context: AudioContext) {
    this.#destination = context.createGain();

    this.#destination.connect(context.destination);
  }

  #destination: GainNode;

  get destination(): AudioNode {
    return this.#destination;
  }

  get volume(): number {
    return this.#destination.gain.value;
  }

  set volume(value: number) {
    this.#destination.gain.value = value;
  }

  dispose() {
    this.#destination.disconnect();
  }
}
