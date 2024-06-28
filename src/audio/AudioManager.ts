import { AudioChannel } from "./AudioChannel";
import { AudioBufferTrack } from "./track/AudioBufferTrack";

export class AudioManager {
  constructor() {
    this.context = new AudioContext();
    this.#setupContextAutostart();
  }

  readonly context: AudioContext;

  createTrack(channel: AudioChannel, buffer: AudioBuffer) {
    return new AudioBufferTrack(this.context, channel, buffer);
  }

  #resumed = new AbortController();
 
  #channels = new Set<AudioChannel>();

  createChannel(): AudioChannel {
    const channel = new AudioChannel(this.context);
    this.#channels.add(channel);
    return channel;
  }


  #setupContextAutostart() {
    document.addEventListener(
      "keydown",
      this.#resumeContext.bind(this),
      {
        signal: this.#resumed.signal,
      }
    );
    document.addEventListener(
      "mousedown",
      this.#resumeContext.bind(this),
      {
        signal: this.#resumed.signal,
      }
    );
  }

  #resumeContext() {
    if (this.context.state === "running") return;

    this.context.resume();
    this.#resumed.abort();
  }
}
