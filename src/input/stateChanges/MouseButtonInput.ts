import type { ButtonStates } from "../state/ButtonStates";
import type { InputState } from "../state/InputState";
import type { MouseButton } from "../state/MouseButton";
import { ButtonInput } from "./ButtonInput";

export class MouseButtonInput extends ButtonInput<MouseButton> {
  constructor(
    button: MouseButton,
    isPressed: boolean
  ) {
    super(button, isPressed);
  }
  
  protected override getButtonStates(state: InputState): ButtonStates<MouseButton> {
      return state.mouse.buttons;
  }
}