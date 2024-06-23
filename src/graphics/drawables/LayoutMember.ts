import { Drawable, InvalidationSource, type Invalidation } from "./Drawable";

export class LayoutMember {
  constructor(
    readonly invalidation: Invalidation,
    readonly source: InvalidationSource = InvalidationSource.Default,
    readonly condition?: (
      drawable: Drawable,
      invalidation: Invalidation
    ) => boolean
  ) {}

  parent?: Drawable;

  #isValid = false;

  get isValid() {
    return this.#isValid;
  }

  invalidate() {
    this.#isValid = false;
  }

  validate() {
    if (!this.#isValid) {
      this.#isValid = true;
      this.parent?.validateSuperTree(this.invalidation);
    }
  }
}
