import { Bindable } from '../../bindables/Bindable';
import type { MouseDownEvent } from '../../input';
import type { ClickEvent } from '../../input/events/ClickEvent';
import { Container } from './Container';

export class ClickableContainer extends Container {
  #action?: () => void;

  get action() {
    return this.#action;
  }

  set action(value) {
    this.#action = value;
    if (value) this.enabled.value = true;
  }

  public trigger = ButtonTrigger.Click;

  public readonly enabled = new Bindable(false);

  override onClick(e: ClickEvent): boolean {
    if (this.enabled.value && this.trigger === ButtonTrigger.Click)
      this.action?.();
    return true;
  }

  override onMouseDown(e: MouseDownEvent): boolean {
    if (this.enabled.value && this.trigger === ButtonTrigger.MouseDown)
      this.action?.();
    return true;
  }
}

export enum ButtonTrigger {
  Click,
  MouseDown,
}
