import type { ClickEvent } from './events/ClickEvent';
import type { DragEndEvent } from './events/DragEndEvent';
import type { DragEvent } from './events/DragEvent';
import type { DragStartEvent } from './events/DragStartEvent';
import type { HoverEvent } from './events/HoverEvent';
import type { HoverLostEvent } from './events/HoverLostEvent';
import type { MouseDownEvent } from './events/MouseDownEvent';
import type { MouseMoveEvent } from './events/MouseMoveEvent';
import type { MouseUpEvent } from './events/MouseUpEvent';
import type { ScrollEvent } from './events/ScrollEvent';

export interface IInputReceiver {
  onMouseMove?(e: MouseMoveEvent): boolean;
  onHover?(e: HoverEvent): boolean;
  onMouseDown?(e: MouseDownEvent): boolean;
  onMouseUp?(e: MouseUpEvent): boolean;
  onClick?(e: ClickEvent): boolean;
  onHoverLost?(e: HoverLostEvent): boolean;
  onDragStart?(e: DragStartEvent): boolean;
  onDrag?(e: DragEvent): boolean;
  onDragEnd?(e: DragEndEvent): boolean;
  onScroll?(e: ScrollEvent): boolean;
}
