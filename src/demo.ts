import { Game } from "./Game";
import { Box } from "./graphics/shapes/Box";
import { WebGameHost } from "./platform/WebGameHost";
import { ManualInputManager } from "./input/ManualInputManager";
import type { MouseDownEvent } from "./input/events/MouseDownEvent";
import { Vec2 } from "./math";
import "./style.css";

const host = new WebGameHost("demo");

class DemoGame extends Game {
  constructor() {
    super();

    let inputManager: ManualInputManager;
    let child: Box;
    this.add(
      (inputManager = new ManualInputManager().apply({
        children: [
          (child = new MyBox().apply({
            label: "Box 1",
            position: { x: 100, y: 100 },
            size: { x: 100, y: 100 },
          })),
        ],
      }))
    );

    inputManager.showVisualCursorGuide = true;
    inputManager.useParentInput = false;

    setTimeout(() => {
      inputManager.moveMouseToDrawable(child);

      setTimeout(() => {
        inputManager.moveMouseTo(new Vec2(300, 200));
      }, 1000);
    }, 1000);
  }
}

class MyBox extends Box {
  override onHover() {
    this.alpha = 0.8;
    return true;
  }

  override onHoverLost() {
    this.alpha = 1;
    return true;
  }

  override onMouseDown(e: MouseDownEvent): boolean {
    console.log("onMouseDown", this.label);
    return true;
  }

  override onMouseUp(e: MouseDownEvent): boolean {
    console.log("onMouseUp", this.label);
    return true;
  }

  override onClick(e: MouseDownEvent): boolean {
    console.log("onClick", this.label);
    return true;
  }
}

host.run(new DemoGame());
