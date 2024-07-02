import { Bindable } from '../../bindables/Bindable';
import { Container } from './Container';

export abstract class VisibilityContainer extends Container {
  readonly state = new Bindable<Visibility>(Visibility.Hidden);
  #didInitialHide = false;

  protected get startHidden() {
    return this.state.value == Visibility.Hidden;
  }

  override onLoadComplete() {
    this.state.addOnChangeListener(this.updateState, {
      immediate: this.state.value === Visibility.Visible || !this.#didInitialHide,
    });

    super.onLoadComplete();
  }

  override show() {
    this.state.value = Visibility.Visible;
  }

  override hide() {
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
    switch (state) {
      case Visibility.Visible:
        this.popIn();
        break;
      case Visibility.Hidden:
        this.popOut();
        break;
    }
  };
}

export const enum Visibility {
  Hidden = 0,
  Visible = 1,
}
