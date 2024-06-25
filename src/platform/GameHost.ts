import { FrameworkEnvironment } from "../FrameworkEnvironment";
import type { Game } from "../Game";
import { DependencyContainer } from "../di/DependencyContainer";
import type { Container } from "../graphics/drawables/containers/Container";
import { UserInputManager } from "../input/UserInputManager";
import { Vec2 } from "../math";
import { Renderer } from "../renderers/Renderer";

export interface GameHostOptions {
  friendlyGameName?: string;
}

export abstract class GameHost {
  #renderer?: Renderer;

  get renderer(): Renderer {
    if (!this.#renderer) throw new Error("Renderer not initialized");

    return this.#renderer;
  }

  name: string;

  readonly dependencies = new DependencyContainer();

  protected constructor(gameName: string, options: GameHostOptions = {}) {
    this.name =
      options.friendlyGameName ?? `osucad framework running "${gameName}"`;
  }

  protected root: Container | null = null;

  #frameCount = 0;

  executionState: ExecutionState = ExecutionState.Idle;

  abstract getWindowSize(): Vec2;

  update() {
    if (!this.root) return;

    this.#frameCount++;

    this.renderer!.size = this.getWindowSize();

    this.root.size = this.getWindowSize();

    this.root.size = this.root.size.componentMax(Vec2.one());

    this.root.updateSubTree();
  }

  protected render() {
    this.renderer!.render(this.root!);
  }

  async takeScreenshot(): Promise<Blob> {
    throw new Error("Not implemented");
  }

  async run(game: Game, container: HTMLElement = document.body) {
    if (this.executionState !== ExecutionState.Idle) {
      throw new Error("GameHost is already running");
    }

    this.root = game;

    game.host = this;

    window.addEventListener("error", (event) => {
      this.onUnhandledError(event.error);
    });
    window.addEventListener("unhandledrejection", (event) => {
      this.onUnhandledRejection(event);
    });

    this.dependencies.provide(this);

    this.#populateInputHandlers();

    await this.#chooseAndSetupRenderer();

    this.#initializeInputHandlers();

    this.dependencies.provide(this.renderer!);

    this.#bootstrapSceneGraph(game);

    container.appendChild(this.renderer!.canvas);

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

  #populateInputHandlers() {}

  #initializeInputHandlers() {}

  #bootstrapSceneGraph(game: Game) {
    // TODO: add root containers for input handling & safe area insets
    const root = new UserInputManager().apply({
      child: game,
    });

    this.dependencies.provide(game);
    game.host = this;
    root.load(this.dependencies);

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
}

export const enum ExecutionState {
  Idle = 0,
  Stopped = 1,
  Running = 2,
}
