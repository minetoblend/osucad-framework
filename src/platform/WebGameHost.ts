import { Vec2 } from "../math";
import { GameHost, type GameHostOptions } from "./GameHost";

export class WebGameHost extends GameHost {
  override getWindowSize(): Vec2 {
    return new Vec2(window.innerWidth, window.innerHeight);
  }

  constructor(gameName: string, options: GameHostOptions = {}) {
    super(gameName, options);
  }
}
