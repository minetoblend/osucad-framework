import { PIXIBitmapText, PIXIContainer, PIXITextStyle, type PIXITextStyleOptions } from '../../pixi';
import { Drawable, Invalidation, type DrawableOptions } from '../drawables/Drawable';
import { LayoutMember } from '../drawables/LayoutMember';
import type { FontDefinition } from './FontDefinition';

export interface SpriteTextOptions extends DrawableOptions {
  text?: string;
  style?: PIXITextStyle | PIXITextStyleOptions;
  font?: FontDefinition;
}

export class SpriteText extends Drawable {
  constructor(options: SpriteTextOptions = {}) {
    const { text, font, style, ...rest } = options;

    super();

    this.apply(rest);

    this.text = text ?? '';

    if (style) {
      this.#textStyle = new PIXITextStyle(style);
    } else {
      this.#textStyle = new PIXITextStyle();
    }
    if (font) {
      this.#textStyle.fontFamily = font.font.fontFamily;
    }
  }

  #textDrawNode!: PIXIBitmapText;

  createDrawNode(): PIXIContainer {
    return new PIXIContainer({
      children: [
        (this.#textDrawNode = new PIXIBitmapText({
          resolution: 2,
          style: this.#textStyle,
        })),
      ],
    });
  }

  #textBacking = new LayoutMember(Invalidation.None);

  #textStyle: PIXITextStyle;

  get style() {
    return this.#textStyle;
  }

  set style(value: PIXITextStyle) {
    this.#textStyle = value;
    this.#textDrawNode.style = value;
    this.#textBacking.invalidate();
  }

  #text: string = '';

  get text() {
    return this.#text;
  }

  set text(value: string) {
    if (value === this.#text) return;

    this.#text = value;

    this.#textBacking.invalidate();
    this.invalidate(Invalidation.DrawSize);
  }

  override update() {
    super.update();

    if (!this.#textBacking.isValid) {
      this.#textDrawNode.text = this.#text;
      this.width = this.#textDrawNode.width;
      this.height = this.#textDrawNode.height;
      this.#textBacking.validate();
    }
  }
}
