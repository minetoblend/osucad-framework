import { Game, Box, WebGameHost, MouseDownEvent, Container, Axes } from '.';

import './style.css';

const host = new WebGameHost('demo');

class DemoGame extends Game {
  constructor() {
    super();

    this.add(
      Container.create({
        autoSizeAxes: Axes.Both,
        children: [
          new Box().with({
            relativeSizeAxes: Axes.Both,
            tint: 0xff0000,
          }),
          Container.create({
            autoSizeAxes: Axes.Both,
            padding: 25,
            children: [
              new MyBox().with({
                width: 100,
                height: 100,
              }),
            ],
          }),
        ],
      }),
    );
  }
}

class MyBox extends Box {
  override onHover() {
    this.width = 120;
    return true;
  }

  override onHoverLost() {
    this.width = 100;
    return true;
  }

  override onMouseDown(e: MouseDownEvent): boolean {
    console.log('onMouseDown', this.label);
    return true;
  }

  override onMouseUp(e: MouseDownEvent): boolean {
    console.log('onMouseUp', this.label);
    return true;
  }

  override onClick(e: MouseDownEvent): boolean {
    console.log('onClick', this.label);
    return true;
  }
}

host.run(new DemoGame());
