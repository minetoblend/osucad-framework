import type { ITransformable } from './ITransformable.ts';
import type { Transform } from './Transform.ts';

export class TransformSequence<T extends ITransformable> {
  readonly #transforms: Transform[] = [];

  readonly #origin: T;

  // @ts-expect-error unused property
  readonly #startTime: number;

  #currentTime: number;

  #lastEndTime: number;

  get #endTime() {
    return Math.max(this.#currentTime, this.#lastEndTime);
  }

  #last: Transform | null = null;

  get #hasEnd() {
    return this.#endTime !== Infinity;
  }

  constructor(origin: T) {
    this.#origin = origin;
    this.#startTime = this.#currentTime = this.#lastEndTime = origin.transformStartTime;
  }

  add(transform: Transform) {
    if (transform.targetTransformable !== this.#origin)
      throw new Error('Transform does not target the origin of this sequence');

    this.#transforms.push(transform);

    if (this.#last === null || transform.endTime > this.#last.endTime) {
      this.#last = transform;
      this.#lastEndTime = this.#last.endTime;
    }
  }

  append(generator: (o: T) => TransformSequence<T>) {
    let child: TransformSequence<T>;
    {
      using _ = this.#origin.beginAbsoluteSequence(this.#currentTime, false);
      child = generator(this.#origin);
    }

    if (child!.origin !== this.#origin)
      throw new Error('Child sequence does not target the same origin as the parent sequence');

    for (const t of child!.transforms) {
      this.add(t);
    }

    return this;
  }

  get origin() {
    return this.#origin;
  }

  get transforms(): ReadonlyArray<Transform> {
    return this.#transforms;
  }

  delay(duration: number) {
    this.#currentTime += duration;

    return this;
  }

  then(delay = 0) {
    if (!this.#hasEnd) {
      throw Error('Can not perform then on an endless TransformSequence.');
    }

    this.#currentTime = this.#endTime;
    return this.delay(delay);
  }
}
