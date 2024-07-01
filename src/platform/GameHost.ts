import { FrameworkEnvironment } from '../FrameworkEnvironment';
import type { Game } from '../Game';
import { AudioManager } from '../audio/AudioManager';
import { DependencyContainer } from '../di/DependencyContainer';
import type { Container } from '../graphics/containers/Container';
import { loadDrawable } from '../graphics/drawables/Drawable';
import { GAME_HOST } from '../injectionTokens';
import { UserInputManager } from '../input/UserInputManager';
import { Vec2 } from '../math';
import { Renderer } from '../renderers/Renderer';
import { FramedClock } from '../timing/FramedClock';
import type { IFrameBasedClock } from '../timing/IFrameBasedClock';
import { KeyboardHandler } from '../input/handlers/KeyboardHandler';
import { MouseHandler } from '../input/handlers/MouseHandler';
import type { InputHandler } from '../input';
import { KeyBinding } from '../input/bindings/KeyBinding';
import { KeyCombination } from '../input/bindings/KeyCombination';
import { InputKey } from '../input/state/InputKey';
import { PlatformAction } from '../input/PlatformAction';
import { PlatformActionContainer } from '../input/PlatformActionContainer';

export interface GameHostOptions {
  friendlyGameName?: string;
}

export abstract class GameHost {
  get renderer(): Renderer {
    if (!this.#renderer) throw new Error('Renderer not initialized');

    return this.#renderer;
  }

  #renderer?: Renderer;

  get audioManager(): AudioManager {
    if (!this.#audioManager) throw new Error('AudioManager not initialized');

    return this.#audioManager;
  }

  #audioManager?: AudioManager;

  clock!: IFrameBasedClock;

  name: string;

  readonly dependencies = new DependencyContainer();

  protected constructor(gameName: string, options: GameHostOptions = {}) {
    this.name = options.friendlyGameName ?? `osucad framework running "${gameName}"`;
  }

  protected root: Container | null = null;

  #frameCount = 0;

  executionState: ExecutionState = ExecutionState.Idle;

  abstract getWindowSize(): Vec2;

  update() {
    if (!this.root) return;

    this.#frameCount++;

    this.renderer.size = this.getWindowSize();

    this.root.size = this.getWindowSize();

    this.root.size = this.root.size.componentMax(Vec2.one());

    this.clock.processFrame();

    this.root.updateSubTree();
    this.root.updateSubTreeTransforms();
  }

  protected render() {
    this.renderer.render(this.root!);
  }

  async takeScreenshot(): Promise<Blob> {
    throw new Error('Not implemented');
  }

  async run(game: Game, container: HTMLElement = document.body) {
    if (this.executionState !== ExecutionState.Idle) {
      throw new Error('GameHost is already running');
    }

    window.addEventListener('error', (event) => {
      this.onUnhandledError(event.error);
    });
    window.addEventListener('unhandledrejection', (event) => {
      this.onUnhandledRejection(event);
    });

    this.dependencies.provide(GAME_HOST, this);

    this.#populateInputHandlers();

    await this.#chooseAndSetupRenderer();

    this.#initializeInputHandlers();

    this.#audioManager = new AudioManager();

    this.dependencies.provide(this.renderer);
    this.dependencies.provide(this.audioManager);

    this.#bootstrapSceneGraph(game);

    container.appendChild(this.renderer.canvas);

    this.executionState = ExecutionState.Running;

    while (this.executionState === ExecutionState.Running) {
      this.update();
      this.render();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    this.#performExit();
  }

  onUnhandledError(error: Error) {
    console.error(error);
    return false;
  }

  onUnhandledRejection(event: PromiseRejectionEvent) {
    console.error(event.reason);
    return false;
  }

  async #chooseAndSetupRenderer() {
    const renderer = new Renderer();

    await renderer.init({
      size: this.getWindowSize(),
      environment: new FrameworkEnvironment(),
    });

    this.#renderer = renderer;
  }

  protected createAvailableInputHandlers() {
    return [new KeyboardHandler(), new MouseHandler()];
  }

  #populateInputHandlers() {
    this.availableInputHandlers = this.createAvailableInputHandlers();
  }

  availableInputHandlers!: InputHandler[];

  #initializeInputHandlers() {}

  #bootstrapSceneGraph(game: Game) {
    // TODO: add root containers for input handling & safe area insets
    const root = new UserInputManager();

    root.child = new PlatformActionContainer().apply({
      child: game,
    });

    root.isAlive = true;

    this.dependencies.provide(root);
    this.dependencies.provide(game);

    game.host = this;

    loadDrawable(root, (this.clock = new FramedClock()), this.dependencies);

    this.root = root;
  }

  #performExit() {
    if (this.executionState === ExecutionState.Running) {
      this.dispose();
    }
    this.executionState = ExecutionState.Stopped;
  }

  #isDisposed = false;

  get isDisposed() {
    return this.#isDisposed;
  }

  dispose() {
    if (this.isDisposed) return false;

    this.root?.dispose();
  }

  get platformKeyBindings(): KeyBinding[] {
    return [
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.X), PlatformAction.Cut),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.C), PlatformAction.Copy),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.V), PlatformAction.Paste),
      new KeyBinding(KeyCombination.from(InputKey.Shift, InputKey.Delete), PlatformAction.Cut),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Insert), PlatformAction.Copy),
      new KeyBinding(KeyCombination.from(InputKey.Shift, InputKey.Insert), PlatformAction.Paste),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.A), PlatformAction.SelectAll),
      new KeyBinding(KeyCombination.from(InputKey.Left), PlatformAction.MoveBackwardChar),
      new KeyBinding(KeyCombination.from(InputKey.Right), PlatformAction.MoveForwardChar),
      new KeyBinding(KeyCombination.from(InputKey.BackSpace), PlatformAction.DeleteBackwardChar),
      new KeyBinding(KeyCombination.from(InputKey.Delete), PlatformAction.DeleteForwardChar),
      new KeyBinding(KeyCombination.from(InputKey.Shift, InputKey.Left), PlatformAction.SelectBackwardChar),
      new KeyBinding(KeyCombination.from(InputKey.Shift, InputKey.Right), PlatformAction.SelectForwardChar),
      new KeyBinding(KeyCombination.from(InputKey.Shift, InputKey.BackSpace), PlatformAction.DeleteBackwardChar),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Left), PlatformAction.MoveBackwardWord),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Right), PlatformAction.MoveForwardWord),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.BackSpace), PlatformAction.DeleteBackwardWord),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Delete), PlatformAction.DeleteForwardWord),
      new KeyBinding(
        KeyCombination.from(InputKey.Control, InputKey.Shift, InputKey.Left),
        PlatformAction.SelectBackwardWord,
      ),
      new KeyBinding(
        KeyCombination.from(InputKey.Control, InputKey.Shift, InputKey.Right),
        PlatformAction.SelectForwardWord,
      ),
      new KeyBinding(KeyCombination.from(InputKey.Home), PlatformAction.MoveBackwardLine),
      new KeyBinding(KeyCombination.from(InputKey.End), PlatformAction.MoveForwardLine),
      new KeyBinding(KeyCombination.from(InputKey.Shift, InputKey.Home), PlatformAction.SelectBackwardLine),
      new KeyBinding(KeyCombination.from(InputKey.Shift, InputKey.End), PlatformAction.SelectForwardLine),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.PageUp), PlatformAction.DocumentPrevious),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.PageDown), PlatformAction.DocumentNext),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Tab), PlatformAction.DocumentNext),
      new KeyBinding(
        KeyCombination.from(InputKey.Control, InputKey.Shift, InputKey.Tab),
        PlatformAction.DocumentPrevious,
      ),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.W), PlatformAction.DocumentClose),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.F4), PlatformAction.DocumentClose),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.N), PlatformAction.DocumentNew),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.T), PlatformAction.TabNew),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Shift, InputKey.T), PlatformAction.TabRestore),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.S), PlatformAction.Save),
      new KeyBinding(KeyCombination.from(InputKey.Home), PlatformAction.MoveToListStart),
      new KeyBinding(KeyCombination.from(InputKey.End), PlatformAction.MoveToListEnd),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Z), PlatformAction.Undo),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Y), PlatformAction.Redo),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Shift, InputKey.Z), PlatformAction.Redo),
      new KeyBinding(KeyCombination.from(InputKey.Delete), PlatformAction.Delete),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Plus), PlatformAction.ZoomIn),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.KeypadPlus), PlatformAction.ZoomIn),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Minus), PlatformAction.ZoomOut),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.KeypadMinus), PlatformAction.ZoomOut),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Number0), PlatformAction.ZoomDefault),
      new KeyBinding(KeyCombination.from(InputKey.Control, InputKey.Keypad0), PlatformAction.ZoomDefault),
    ];
  }
}

export const enum ExecutionState {
  Idle = 0,
  Stopped = 1,
  Running = 2,
}
