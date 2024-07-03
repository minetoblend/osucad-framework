import type { ScreenTransitionEvent } from './ScreenTransitionEvent.ts';
import type { ScreenExitEvent } from './ScreenExitEvent.ts';
import type { Drawable } from '../graphics';

export interface IScreen extends Drawable {
  readonly isScreen: true;

  validForResume: boolean;

  validForPush: boolean;

  onEntering(e: ScreenTransitionEvent): void;

  onExiting(e: ScreenExitEvent): boolean;

  onResuming(e: ScreenTransitionEvent): void;

  onSuspending(e: ScreenTransitionEvent): void;
}

export function isScreen(obj: any): obj is IScreen {
  return obj.isScreen === true;
}
