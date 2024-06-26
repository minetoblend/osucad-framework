import { AudioChannel } from './AudioChannel';
import { Sample } from './sample/Sample';
import { AudioBufferTrack } from './track/AudioBufferTrack';

export class AudioManager {
  constructor() {
    this.context = new AudioContext();
    this.#setupContextAutostart();
  }

  readonly context: AudioContext;

  createTrack(channel: AudioChannel, buffer: AudioBuffer) {
    return new AudioBufferTrack(this.context, channel, buffer);
  }

  createTrackFromUrl(channel: AudioChannel, url: string) {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => this.context.decodeAudioData(data))
      .then((buffer) => this.createTrack(channel, buffer));
  }

  createSample(channel: AudioChannel, buffer: AudioBuffer) {
    return new Sample(this.context, channel, buffer);
  }

  createSampleFromUrl(channel: AudioChannel, url: string) {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => this.context.decodeAudioData(data))
      .then((buffer) => this.createSample(channel, buffer));
  }

  #resumed = new AbortController();

  #channels = new Set<AudioChannel>();

  createChannel(): AudioChannel {
    const channel = new AudioChannel(this.context);
    this.#channels.add(channel);
    return channel;
  }

  #setupContextAutostart() {
    document.addEventListener('keydown', this.#resumeContext.bind(this), {
      signal: this.#resumed.signal,
    });
    document.addEventListener('mousedown', this.#resumeContext.bind(this), {
      signal: this.#resumed.signal,
    });
  }

  #resumeContext() {
    if (this.context.state === 'running') return;

    this.context.resume();
    this.#resumed.abort();
  }
}
