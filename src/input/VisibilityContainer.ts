import { Bindable } from "../bindables/Bindable";
import { Container } from "../graphics/drawables/containers/Container";
import type { MouseMoveEvent } from "./events/MouseMoveEvent";

export abstract class VisibilityContainer extends Container {
  readonly state = new Bindable<Visibility>(Visibility.Hidden);
  #didInitialHide = false;

  protected get startHidden() {
    return this.state.value == Visibility.Hidden;
  }

  override onLoadComplete() {
    this.state.addOnChangeListener(this.updateState, {
      immediate: this.state.value === Visibility.Visible || !this.#didInitialHide
    });

    super.onLoadComplete();
  }

  show() {
    this.state.value = Visibility.Visible;
  }

  hide() {
    this.state.value = Visibility.Hidden;
  }

  toggleVisibility() {
    this.state.value = this.state.value == Visibility.Visible ? Visibility.Hidden : Visibility.Visible;
  }

  override get propagateNonPositionalInputSubTree() {
    return this.state.value == Visibility.Visible;
  }

  override get propagatePositionalInputSubTree() {
    return this.state.value == Visibility.Visible;
  }

  abstract popIn(): void;

  abstract popOut(): void;

  updateState = (state: Visibility) => {
    console.log("updateState", state);
    switch (state) {
      case Visibility.Visible:
        this.popIn();
        break;
      case Visibility.Hidden:
        this.popOut();
        break;
    }
  }
}

export const enum Visibility {
  Hidden = 0,
  Visible = 1,
}
