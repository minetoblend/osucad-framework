import type { AudioChannel } from '../AudioChannel';
import { SamplePlayback } from './SamplePlayback';

export interface SamplePlayOptions {
  rate?: number;
  volume?: number;
  delay?: number;
}

export class Sample {
  constructor(
    readonly context: AudioContext,
    readonly channel: AudioChannel,
    readonly buffer: AudioBuffer,
  ) {}

  get length() {
    return this.buffer.duration * 1000;
  }

  play(options: SamplePlayOptions): SamplePlayback {
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;

    if (options.rate) {
      source.playbackRate.value = options.rate;
    }

    let destination = this.channel.destination;

    let gain: GainNode | undefined;

    if (options.volume !== undefined && options.volume !== 1) {
      const gain = this.context.createGain();
      gain.gain.value = options.volume;
      destination.connect(gain);
      destination = gain;
    }

    source.connect(destination);

    source.onended = () => {
      if (gain) {
        gain.disconnect();
      }

      source.disconnect();
    };

    source.start(undefined, options.delay ? options.delay / 1000 : undefined);

    return new SamplePlayback(source, this.context, this.channel);
  }
}
