import type { IScreen } from './IScreen.ts';
import { Axes, CompositeDrawable } from '../graphics';
import { resolved } from '../di';
import { Game } from '../Game.ts';
import type { IFrameBasedClock } from '../timing';
import { ScreenStack } from './ScreenStack.ts';
import { type ScreenTransitionEvent } from './ScreenTransitionEvent.ts';
import type { ScreenExitEvent } from './ScreenExitEvent.ts';

export abstract class Screen extends CompositeDrawable implements IScreen {
  readonly isScreen = true;

  validForResume = true;

  validForPush = true;

  override get removeWhenNotAlive() {
    return false;
  }

  @resolved(Game)
  game!: Game;

  constructor() {
    super();
    this.relativeSizeAxes = Axes.Both;
  }

  override updateClock(clock: IFrameBasedClock) {
    super.updateClock(clock);

    if (this.parent !== null && !(this.parent instanceof ScreenStack))
      throw new Error(
        `Screens must always be added to a ScreenStack (attempted to add ${this.name} to ${this.parent.name})`,
      );
  }

  onEntering(e: ScreenTransitionEvent) {}

  onExiting(e: ScreenExitEvent): boolean {
    return false;
  }

  onResuming(e: ScreenTransitionEvent) {}

  onSuspending(e: ScreenTransitionEvent) {}
}
