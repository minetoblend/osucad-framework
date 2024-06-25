import { Axes } from "../graphics/drawables/Axes";
import type { Drawable } from "../graphics/drawables/Drawable";
import { Container } from "../graphics/drawables/containers/Container";
import { PIXIGraphics } from "../pixi";
import { Visibility, VisibilityContainer } from "./VisibilityContainer";
import type { MouseMoveEvent } from "./events/MouseMoveEvent";

export class CursorContainer extends VisibilityContainer {
  activeCursor: Drawable;

  constructor() {
    super();
    // Depth = float.MinValue;
    this.relativeSizeAxes = Axes.Both;

    this.state.value = Visibility.Visible;

    this.activeCursor = this.createCursor();
  }

  createCursor(): Drawable {
    return new Cursor();
  }

  override onLoad() {
    super.onLoad();

    this.add(this.activeCursor);
  }

  override popIn() {
    this.alpha = 1;
  }

  override popOut() {
    this.alpha = 0;
  }

  override onMouseMove(e: MouseMoveEvent): boolean {
    this.position = e.screenSpaceMousePosition;
    return super.onMouseMove?.(e) ?? false;
  }

  override receivePositionalInputAt(pos: Vec2): boolean {
    return true;
  }
}

class Cursor extends Container {
  override onLoadComplete() {
    super.onLoadComplete();

    const g = new PIXIGraphics();

    g.circle(0, 0, 4).fill({ color: 0xffffff }).stroke({
      color: "rgb(247, 99, 164)",
      width: 2,
      alignment: 1,
    });

    this.drawNode.addChild(g);
  }
}
