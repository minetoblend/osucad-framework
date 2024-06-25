import { Game } from "./Game";
import { Anchor } from "./graphics/drawables/Anchor";
import { Axes } from "./graphics/drawables/Axes";
import { Box } from "./graphics/shapes/Box";
import type { HoverEvent } from "./input/events/HoverEvent";
import type { UIEvent } from "./input/events/UIEvent";
import { WebGameHost } from "./platform/WebGameHost";
import "./style.css";

const host = new WebGameHost("demo");

class DemoGame extends Game {
  constructor() {
    super();

    this.add(
      new MyBox().apply({
        label: "Box 1",
        relativeSizeAxes: Axes.Both,
        width: 0.5,
      })
    );

    this.add(
      new MyBox().apply({
        label: "Box 2",
        relativeSizeAxes: Axes.Both,
        anchor: Anchor.Center,
        origin: Anchor.Center,
        width: 0.5,
        height: 0.5,
        tint: "red",
      })
    );
  }
}

class MyBox extends Box {}

host.run(new DemoGame());
