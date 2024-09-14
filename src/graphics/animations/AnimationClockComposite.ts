import type { IAnimation } from './IAnimation.ts';
import { CustomisableSizeCompositeDrawable } from './CustomisableSizeCompositeDrawable.ts';
import { ManualClock } from '../../timing/ManualClock.ts';
import { dependencyLoader } from '../../di';
import { Container } from '../containers';
import { FramedClock, type IFrameBasedClock } from '../../timing';
import { Axes, Drawable } from '../drawables';
import { clamp } from '../../utils';

export abstract class AnimationClockComposite extends CustomisableSizeCompositeDrawable implements IAnimation {
  readonly #startAtCurrentTime: boolean;

  #hasSeeked = false;

  readonly #manualClock = new ManualClock();

  protected constructor(startAtCurrentTime: boolean = true) {
    super();

    this.#startAtCurrentTime = startAtCurrentTime;
  }

  get finishedPlaying(): boolean {
    return !this.loop && this.playbackPosition > this.duration;
  }

  @dependencyLoader()
  [Symbol('load')]() {
    super.addInternal(
      new Container({
        relativeSizeAxes: Axes.Both,
        clock: new FramedClock(this.#manualClock),
        child: this.createContent(),
      }),
    );
  }

  override get clock(): IFrameBasedClock | null {
    return super.clock;
  }

  override set clock(value: IFrameBasedClock) {
    super.clock = value;
    this.#consumeClockTime();
  }

  protected override loadComplete() {
    super.loadComplete();

    const elapsed = this.#consumeClockTime();

    if (!this.#startAtCurrentTime && !this.#hasSeeked) {
      this.#manualClock.currentTime += elapsed;
    }
  }

  protected override addInternal<T extends Drawable>(drawable: T): undefined | T {
    throw Error('Use createContent instead.');
  }

  protected abstract createContent(): Drawable;

  #lastConsumedTime = 0;

  override update() {
    super.update();

    const consumedTime = this.#consumeClockTime();
    if (this.isPlaying) {
      this.#manualClock.currentTime += consumedTime;
    }
  }

  get playbackPosition() {
    let current = this.#manualClock.currentTime;

    if (this.loop) current %= this.duration;

    return clamp(current, 0, this.duration);
  }

  set playbackPosition(value: number) {
    this.#hasSeeked = true;

    this.#manualClock.currentTime = value;

    if (this.isLoaded) {
      this.#consumeClockTime();
    }
  }

  #duration = 0;

  get duration() {
    return this.#duration;
  }

  protected set duration(value: number) {
    this.#duration = value;
  }

  isPlaying = true;

  loop = false;

  seek(time: number) {
    this.playbackPosition = time;
  }

  #consumeClockTime() {
    const elapsed = this.time.current - this.#lastConsumedTime;
    this.#lastConsumedTime = this.time.current;
    return elapsed;
  }
}
