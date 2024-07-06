import type { AudioChannel } from '../AudioChannel';
import { Track } from './Track';

export class AudioBufferTrack extends Track {
  constructor(
    readonly context: AudioContext,
    readonly channel: AudioChannel,
    readonly buffer: AudioBuffer,
  ) {
    super();
  }

  get length() {
    return this.buffer.duration * 1000;
  }

  #source: AudioBufferSourceNode | null = null;

  override get currentTime(): number {
    if (!this.isRunning) return this.#offset;

    return (this.contextTimeMillis - this.#offset) * this.rate;
  }

  override seek(position: number): boolean {
    if (position < 0 || position > this.length) return false;

    if (!this.isRunning) {
      this.#offset = position;
      return true;
    }

    this.stop();
    this.#offset = position;
    this.start();
    return true;
  }

  #offset = 0;

  protected get contextTimeMillis() {
    return this.context.currentTime * 1000;
  }

  override start(): void {
    if (this.isRunning) return;

    this.#source = this.createSource();
    this.#source.start(undefined, this.#offset / 1000);

    this.#offset = this.contextTimeMillis - this.#offset;

    this.#source.onended = (ev) => {
      if (this.contextTimeMillis - this.#offset < this.length - 10) return;
      this.#source = null;
      this.#offset = this.contextTimeMillis - this.#offset;
      this.raiseCompleted();
    };
  }

  override stop(): void {
    if (!this.#source) return;

    this.#source.onended = null;
    this.#source.stop();
    this.#source = null;

    this.#offset = this.contextTimeMillis - this.#offset;
  }

  override get isRunning(): boolean {
    return this.#source !== null;
  }

  #rate = 1;

  override get rate(): number {
    return this.#rate;
  }

  override set rate(value: number) {
    if (!this.isRunning) {
      this.rate = value;
      return;
    }

    this.stop();
    this.#rate = value;
    if (this.#source) {
      this.#source.playbackRate.value = value;
    }
    this.start();
  }

  protected createSource() {
    const source = this.context.createBufferSource();

    source.buffer = this.buffer;

    source.playbackRate.value = this.rate;

    source.connect(this.channel.input);

    return source;
  }

  override dispose(): void {
    this.stop();
  }
}
