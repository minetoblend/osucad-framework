import { Bindable } from "../../bindables/Bindable";
import type { ClickEvent } from "../../input/events/ClickEvent";
import { Container } from "./Container";

export class ClickableContainer extends Container {
  #action?: () => void;

  get action() {
    return this.#action;
  }

  set action(value) {
    this.#action = value;
  }

  public readonly enabled = new Bindable(false);

  override onClick(e: ClickEvent): boolean {
    if (this.enabled.value) this.action?.();
    return true;
  }
}
