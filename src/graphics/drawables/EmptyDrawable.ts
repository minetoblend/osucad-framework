import { Drawable } from './Drawable.ts';
import { PIXIContainer } from '../../pixi.ts';

export class EmptyDrawable extends Drawable {
  override createDrawNode(): PIXIContainer {
    return new PIXIContainer();
  }
}
