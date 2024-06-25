import type { IInputReceiver } from "../IInputReceiver";
import type { InputState } from "../state/InputState";

export class UIEvent {
  constructor(readonly state: InputState, readonly handler: keyof IInputReceiver) {}
}