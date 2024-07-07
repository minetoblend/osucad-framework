import { Drawable, InvalidationSource, type Invalidation } from './Drawable';
import { FrameStatistics } from '../../statistics/FrameStatistics.ts';
import { StatisticsCounterType } from '../../statistics/StatisticsCounterType.ts';

export class LayoutMember {
  constructor(
    readonly invalidation: Invalidation,
    readonly source: InvalidationSource = InvalidationSource.Default,
    readonly condition?: (drawable: Drawable, invalidation: Invalidation) => boolean,
  ) {}

  parent?: Drawable;

  #isValid = false;

  get isValid() {
    return this.#isValid;
  }

  invalidate() {
    if (!this.#isValid) return;

    this.#isValid = false;
    FrameStatistics.increment(StatisticsCounterType.Invalidations);
  }

  validate() {
    if (!this.#isValid) {
      this.#isValid = true;
      this.parent?.validateSuperTree(this.invalidation);
      FrameStatistics.increment(StatisticsCounterType.Refreshes);
    }
  }
}
