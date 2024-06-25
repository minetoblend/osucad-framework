import type { ButtonStates } from "../state/ButtonStates";
import type { InputState } from "../state/InputState";
import type { IInput } from "./IInput";
import type { IInputStateChangeHandler } from "./IInputStateChangeHandler";
import { ButtonStateChangeEvent } from "./events/ButtonStateChangeEvent";
import { ButtonStateChangeKind } from "./events/ButtonStateChangeKind";

export abstract class ButtonInput<TButton> implements IInput {
  constructor(public button: TButton, public isPressed: boolean) {}

  protected abstract getButtonStates(state: InputState): ButtonStates<TButton>;

  protected createEvent(
    state: InputState,
    button: TButton,
    kind: ButtonStateChangeKind
  ): ButtonStateChangeEvent<TButton> {
    return new ButtonStateChangeEvent<TButton>(state, this, button, kind);
  }

  apply(state: InputState, handler: IInputStateChangeHandler): void {
    var buttonStates = this.getButtonStates(state);

    if (buttonStates.setPressed(this.button, this.isPressed)) {
      var buttonStateChange = this.createEvent(
        state,
        this.button,
        this.isPressed
          ? ButtonStateChangeKind.Pressed
          : ButtonStateChangeKind.Released
      );
      handler.handleInputStateChange(buttonStateChange);
    }
  }
}
