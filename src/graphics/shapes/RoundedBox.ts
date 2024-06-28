import { PIXIGraphics } from "../../pixi";
import { LayoutMember } from "../drawables";
import { Drawable, Invalidation, type DrawableOptions } from "../drawables/Drawable";

export interface RoundedBoxOptions extends DrawableOptions {
  cornerRadius?: number;
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
    if (this.#cornerRadius === value)
      return;

    this.#cornerRadius = value;

    this.#graphicsBacking.invalidate();
  }

  #cornerRadius: number = 0;

  #graphics!: PIXIGraphics;

  #graphicsBacking = new LayoutMember(Invalidation.DrawSize);

  override createDrawNode(): PIXIGraphics {
    return this.#graphics = new PIXIGraphics();
  }

  override update() {
    super.update();

    if(!this.#graphicsBacking.isValid) {
      this.#updateGraphics();
    }
  }

  #updateGraphics() {
    const g= this.#graphics;

    g.clear();
    if(this.#cornerRadius > 0) {
      g.roundRect(0, 0, this.drawSize.x, this.drawSize.y, this.#cornerRadius);
    } else {
      g.drawRect(0, 0, this.drawSize.x, this.drawSize.y);
    }

    g.fill({ color: 0xffffff })
  }
}