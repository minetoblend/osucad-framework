import { SortedList } from './SortedList.ts';
import { Action } from '../bindables';

export class ObservableSortedList<T> extends SortedList<T> {
  added = new Action<T>();

  removed = new Action<T>();

  override set(index: number, item: T) {
    const oldValue = this.get(index);
    if (item !== oldValue) {
      if (oldValue) {
        this.onRemoved(oldValue);
      }

      this.onAdded(item);
    }

    super.set(index, item);
  }

  override add(item: T): number {
    const result = super.add(item);
    this.onAdded(item);
    return result;
  }

  override remove(item: T): boolean {
    if (super.remove(item)) {
      this.onRemoved(item);
    }

    return false;
  }

  override removeAt(index: number) {
    super.removeAt(index);

    this.onRemoved(this.get(index)!);
  }

  override removeAll(match: (item: T) => boolean) {
    const toRemove = new Set<T>();

    for (const item of this.items) {
      if (match(item)) {
        toRemove.add(item);
      }
    }

    super.removeAll((it) => toRemove.has(it));

    for (const item of toRemove) {
      this.onRemoved(item);
    }
  }

  override clear() {
    const items = [...this.items];

    super.clear();

    for (const item of items) {
      this.onRemoved(item);
    }
  }

  protected onAdded(item: T) {
    this.added.emit(item);
  }

  protected onRemoved(item: T) {
    this.removed.emit(item);
  }
}
