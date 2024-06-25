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
  
  apply(state: InputState): void {
    state.mouse.setPressed(this.button, this.isPressed);
  }
}