import { Bindable } from './bindables/Bindable';
import { Anchor } from './graphics/drawables/Anchor';
import { Axes } from './graphics/drawables/Axes';
import type { Drawable } from './graphics/drawables/Drawable';
import { Container } from './graphics/containers/Container';
import type { GameHost } from './platform/GameHost';

export abstract class Game extends Container {
  protected constructor() {
    super();

    this.relativeSizeAxes = Axes.Both;

    super.addInternal(
      (this.#content = Container.create({
        relativeSizeAxes: Axes.Both,
        anchor: Anchor.Center,
        origin: Anchor.Center,
      })),
    );
  }

  override addInternal<T extends Drawable>(child: T): T {
    throw new Error(`Cannot call addInternal on ${this.name}, use add() instead`);
  }

  #content: Container;

  #host?: GameHost;

  set host(host: GameHost) {
    this.#host = host;
  }

  get host(): GameHost | undefined {
    return this.#host;
  }

  override get content() {
    return this.#content;
  }

  readonly isActive = new Bindable(false);
}
