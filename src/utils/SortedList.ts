import type { IComparer } from './IComparer.ts';

export class SortedList<T> {
  #items: T[] = [];

  constructor(private readonly comparer: IComparer<T>) {}

  get length() {
    return this.#items.length;
  }

  get(index: number): T | undefined {
    return this.#items[index];
  }

  set(index: number, item: T) {
    this.#items[index] = item;
  }

  add(item: T): number {
    return this.#addInternal(item);
  }

  addRange(items: T[]) {
    for (const item of items) {
      this.add(item);
    }
  }

  #addInternal(item: T) {
    let index = this.binarySearch(item);
    if (index < 0) index = ~index;

    this.#items.splice(index, 0, item);

    return index;
  }

  remove(item: T) {
    const index = this.#items.indexOf(item);

    if (index < 0) {
      return false;
    }

    this.removeAt(index);
    return true;
  }

  removeAt(index: number) {
    this.#items.splice(index, 1);
  }

  removeAll(match: (item: T) => boolean) {
    this.#items = this.#items.filter((item) => !match(item));
  }

  clear() {
    this.#items.length = 0;
  }

  includes(item: T) {
    return this.#items.includes(item);
  }

  binarySearch(item: T) {
    let left = 0;
    let right = this.#items.length - 1;

    while (left <= right) {
      const middle = left + ((right - left) >> 1);
      const compare = this.comparer.compare(this.#items[middle], item);

      if (compare < 0) {
        left = middle + 1;
      } else if (compare > 0) {
        right = middle - 1;
      } else {
        return middle;
      }
    }

    return ~left;
  }

  find(predicate: (value: T, index: number, obj: T[]) => unknown): T | undefined {
    return this.#items.find(predicate);
  }

  filter(predicate: (value: T, index: number, obj: T[]) => unknown): T[] {
    return this.#items.filter(predicate);
  }

  findLast(predicate: (value: T, index: number, obj: T[]) => unknown): T | undefined {
    for (let i = this.#items.length - 1; i >= 0; i--) {
      if (predicate(this.#items[i]!, i, this.#items as T[])) return this.#items[i];
    }

    return undefined;
  }

  findIndex(predicate: (value: T, index: number, obj: T[]) => unknown): number {
    return this.#items.findIndex(predicate);
  }

  sort() {
    this.#items.sort(this.comparer.compare);
  }

  indexOf(item: T) {
    return this.binarySearch(item);
  }

  get first(): T | undefined {
    return this.#items[0];
  }

  get last(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  [Symbol.iterator]() {
    return this.#items[Symbol.iterator]();
  }

  get items(): ReadonlyArray<T> {
    return this.#items;
  }
}
