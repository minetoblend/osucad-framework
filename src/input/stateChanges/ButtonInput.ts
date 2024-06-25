import type { InputState } from "../state/InputState";
import type { IInput } from "./IInput";

export abstract class ButtonInput<TButton> implements IInput {
  
  constructor(
    public button: TButton,
    public isPressed: boolean
  ) {
  }

  abstract apply(state: InputState): void;
}