import { Vec2, type IVec2 } from '../../math/Vec2';
import { Axes } from '../drawables/Axes';
import { Container, type ContainerOptions } from './Container';

export interface DrawSizePreservingFillContainerOptions extends ContainerOptions {
  strategy?: DrawSizePreservationStrategy;
  targetDrawSize?: IVec2;
}

export class DrawSizePreservingFillContainer extends Container {
  strategy: DrawSizePreservationStrategy = DrawSizePreservationStrategy.Minimum;
  targetDrawSize = new Vec2(1024, 768);

  readonly #content: Container;

  constructor(options: DrawSizePreservingFillContainerOptions = {}) {
    super({
      relativeSizeAxes: Axes.Both,
    });

    this.apply(options);

    this.addInternal(
      (this.#content = new Container({
        relativeSizeAxes: Axes.Both,
      })),
    );
  }

  override update() {
    const drawSizeRatio = this.parent!.childSize.div(this.targetDrawSize);

    switch (this.strategy) {
      case DrawSizePreservationStrategy.Minimum:
        this.#content.scale = new Vec2(Math.min(drawSizeRatio.x, drawSizeRatio.y));
        break;
      case DrawSizePreservationStrategy.Maximum:
        this.#content.scale = new Vec2(Math.max(drawSizeRatio.x, drawSizeRatio.y));
        break;
      case DrawSizePreservationStrategy.Average:
        this.#content.scale = new Vec2((drawSizeRatio.x + drawSizeRatio.y) / 2);
        break;
      case DrawSizePreservationStrategy.Stretch:
        this.#content.scale = drawSizeRatio;
        break;
    }

    this.#content.size = {
      x: drawSizeRatio.x === 0 ? 0 : 1 / drawSizeRatio.x,
      y: drawSizeRatio.y === 0 ? 0 : 1 / drawSizeRatio.y,
    };

    this.#content.position = new Vec2(
      (this.parent!.childSize.x - this.#content.scale.x * this.#content.drawSize.x) / 2,
      (this.parent!.childSize.y - this.#content.scale.y * this.#content.drawSize.y) / 2,
    );

    super.update();
  }

  override get content() {
    return this.#content;
  }
}

export const enum DrawSizePreservationStrategy {
  Minimum,
  Maximum,
  Average,
  Stretch,
}
