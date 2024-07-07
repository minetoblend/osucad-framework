import { StatisticsCounterType } from './StatisticsCounterType.ts';

export class FrameStatistics {
  private static COUNTERS = new BigUint64Array(StatisticsCounterType.Length);

  static clear() {
    this.COUNTERS.fill(0n);
  }

  static increment(counterType: StatisticsCounterType) {
    this.COUNTERS[counterType]++;
  }

  static add(counterType: StatisticsCounterType, value: bigint | number) {
    if (typeof value === 'number') {
      value = BigInt(value);
    }

    this.COUNTERS[counterType] += value;
  }

  static get counters() {
    return this.COUNTERS as Readonly<BigUint64Array>;
  }
}
