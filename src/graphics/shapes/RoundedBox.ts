import { PIXIGraphics } from "../../pixi";
import { LayoutMember } from "../drawables";
import {
  Drawable,
  Invalidation,
  type DrawableOptions,
} from "../drawables/Drawable";

export interface RoundedBoxOptions extends DrawableOptions {
  cornerRadius?: number;
  outline?: OutlineInfo;
  outlines?: OutlineInfo[];
  fillAlpha?: number;
}

export interface OutlineInfo {
  color: number;
  width?: number;
  alpha?: number;
  alignment?: number;
}

export class RoundedBox extends Drawable {
  constructor(options: RoundedBoxOptions = {}) {
    super();

    this.addLayout(this.#graphicsBacking);

    this.apply(options);
  }

  get cornerRadius(): number {
    return this.#cornerRadius;
  }

  set cornerRadius(value: number) {
    if (this.#cornerRadius === value) return;

    this.#cornerRadius = value;

    this.#graphicsBacking.invalidate();
  }

  #cornerRadius: number = 0;

  #graphics!: PIXIGraphics;

  #graphicsBacking = new LayoutMember(Invalidation.DrawSize);

  get outlines(): OutlineInfo[] {
    return this.#outlines;
  }

  set outlines(value: OutlineInfo[]) {
    this.#outlines = value;
    this.#graphicsBacking.invalidate();
  }

  #outlines: OutlineInfo[] = [];

  get outline(): OutlineInfo | undefined {
    return this.#outlines[0];
  }

  set outline(value: OutlineInfo | undefined) {
    this.#outlines = value ? [value] : [];
    this.#graphicsBacking.invalidate();
  }

  override createDrawNode(): PIXIGraphics {
    return (this.#graphics = new PIXIGraphics());
  }

  override update() {
    super.update();

    if (!this.#graphicsBacking.isValid) {
      this.#updateGraphics();
      this.#graphicsBacking.validate();
    }
  }

  get fillAlpha(): number {
    return this.#fillAlpha;
  }

  set fillAlpha(value: number) {
    if (this.#fillAlpha === value) return;

    this.#fillAlpha = value;

    this.#graphicsBacking.invalidate();
  }

  #fillAlpha = 1;

  #updateGraphics() {
    const g = this.#graphics;

    g.clear();
    if (this.#cornerRadius > 0) {
      g.roundRect(0, 0, this.drawSize.x, this.drawSize.y, this.#cornerRadius);
    } else {
      g.rect(0, 0, this.drawSize.x, this.drawSize.y);
    }

    g.fill({ color: 0xffffff, alpha: this.#fillAlpha });

    for (const outline of this.#outlines) {
      if (this.#cornerRadius > 0) {
        g.roundRect(0, 0, this.drawSize.x, this.drawSize.y, this.#cornerRadius);
      } else {
        g.rect(0, 0, this.drawSize.x, this.drawSize.y);
      }
      g.stroke({
        color: outline.color,
        width: outline.width ?? 1,
        alpha: outline.alpha ?? 1,
        alignment: outline.alignment ?? 0.5,
      });
    }
  }
}
