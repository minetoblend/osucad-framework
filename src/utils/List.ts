export class List<T> implements Iterable<T> {
  readonly #items: (T | undefined)[];

  readonly #capacity: number;

  #length = 0;

  constructor(capacity: number) {
    this.#items = new Array(capacity);
    this.#capacity = capacity;
  }

  get(index: number): T | undefined {
    return this.#items[index];
  }

  get length(): number {
    return this.#length;
  }

  get capacity() {
    return this.#capacity;
  }

  push(item: T) {
    if (this.#capacity < this.#length + 1) {
      this.#items.length = this.#length * 2;
    }

    this.#items[this.#length++] = item;
  }

  pushAll(item: T[]) {
    if (this.#capacity < this.#length + item.length) {
      this.#items.length = this.#length * 2;
    }

    for (const i of item) {
      this.#items[this.#length++] = i;
    }
  }

  pop(): T | undefined {
    if (this.#length === 0) return undefined;

    const item = this.#items[--this.#length];

    if (this.#length < this.#capacity / 2) {
      this.#items.length = this.#length;
    }

    return item;
  }

  clear() {
    this.#items.length = this.#capacity;
    this.#length = 0;

    for (let i = 0; i < this.#capacity; i++) {
      this.#items[i] = undefined;
    }
  }

  reverse() {
    const items = this.#items;
    let left = null;
    let right = null;
    const length = this.#length;
    for (left = 0, right = length - 1; left < right; left += 1, right -= 1) {
      const temporary = items[left];
      items[left] = items[right];
      items[right] = temporary;
    }
  }

  indexOf(item: T): number {
    for (let i = 0; i < this.#length; i++) {
      if (this.#items[i] === item) return i;
    }

    return -1;
  }

  splice(start: number, deleteCount: number, ...items: T[]): T[] {
    deleteCount = Math.min(deleteCount, this.#length - start);

    const deletedItems = this.#items.splice(start, deleteCount, ...items);
    this.#length += items.length - deleteCount;

    return deletedItems as T[];
  }

  find(predicate: (value: T, index: number, obj: T[]) => unknown): T | undefined {
    for (let i = 0; i < this.#length; i++) {
      if (predicate(this.#items[i]!, i, this.#items as T[])) return this.#items[i];
    }

    return undefined;
  }

  filter(predicate: (value: T, index: number, obj: T[]) => unknown): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.#length; i++) {
      if (predicate(this.#items[i]!, i, this.#items as T[])) result.push(this.#items[i]!);
    }

    return result;
  }

  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    return {
      next: () => {
        if (index >= this.#length)
          return {
            done: true,
            value: undefined,
          };

        return {
          done: false,
          value: this.#items[index++]!,
        };
      },
    };
  }
}
