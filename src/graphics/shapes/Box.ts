import { Drawable } from "../drawables/Drawable";
import { PIXIContainer, PIXISprite, PIXITexture } from "../../pixi";

export class Box extends Drawable {

  #sprite!: PIXISprite;

  override createDrawNode(): PIXIContainer {
    return new PIXIContainer({
      children: [
        this.#sprite = new PIXISprite({
          texture: PIXITexture.WHITE
        })
      ]
    });
  }

  override updateDrawNodeTransform() {
    super.updateDrawNodeTransform();
    this.#sprite.width = this.drawSize.x;
    this.#sprite.height = this.drawSize.y;
  }

}