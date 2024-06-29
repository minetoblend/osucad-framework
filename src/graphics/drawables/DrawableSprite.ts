import type { Texture } from 'pixi.js';
import { PIXIContainer, PIXISprite } from '../../pixi';
import { Drawable, type DrawableOptions } from './Drawable';
import { Vec2 } from '../../math';
import { Axes } from './Axes';

export interface DrawableSpriteOptions extends DrawableOptions {
  texture?: Texture;
}

export class DrawableSprite extends Drawable {
  constructor(options: DrawableSpriteOptions = {}) {
    super();

    this.apply(options);

    if (options.texture) {
      if (
        !options.size &&
        options.width === undefined &&
        options.height === undefined &&
        (options.relativeSizeAxes ?? Axes.None) === Axes.None
      ) {
        this.size = new Vec2(options.texture.width, options.texture.height);
      }
    }
  }

  #sprite!: PIXISprite;

  override createDrawNode() {
    return new PIXIContainer({
      children: [(this.#sprite = new PIXISprite())],
    });
  }

  #texture?: Texture;

  get texture(): Texture | undefined {
    return this.#texture;
  }

  set texture(value: Texture) {
    if (this.#texture === value) return;

    this.#texture = value;

    // ensure the draw node is created
    this.drawNode;

    this.#sprite.texture = value;
  }

  override updateDrawNodeTransform(): void {
    super.updateDrawNodeTransform();

    this.#sprite.setSize(this.drawSize.x, this.drawSize.y);
  }
}
