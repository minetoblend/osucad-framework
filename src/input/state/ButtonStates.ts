export class ButtonStates<TButton> {
  #buttons = new Set<TButton>();

  constructor(buttons?: TButton[]) {
    if (buttons) {
      this.#buttons = new Set(buttons);
    }
  }

  isPressed(button: TButton) {
    return this.#buttons.has(button);
  }

  setPressed(button: TButton, pressed: boolean): boolean {
    if (this.isPressed(button) === pressed) return false;

    if (pressed) {
      this.#buttons.add(button);
    } else {
      this.#buttons.delete(button);
    }

    return true;
  }

  get hasAnyButtonPressed() {
    return this.#buttons.size > 0;
  }

  add(button: TButton) {
    this.#buttons.add(button);
  }
}
