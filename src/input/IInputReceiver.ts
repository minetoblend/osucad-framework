import type { HoverEvent } from "./events/HoverEvent";
import type { HoverLostEvent } from "./events/HoverLostEvent";
import type { MouseMoveEvent } from "./events/MouseMoveEvent";

export interface IInputReceiver {
  onMouseMove(e: MouseMoveEvent): boolean;
  onHover(e: HoverEvent): boolean;
  onHoverLost(e: HoverLostEvent): boolean;
}