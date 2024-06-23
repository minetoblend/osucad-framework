import { FrameworkEnvironment } from "../FrameworkEnvironment";
import type { Drawable } from "../graphics/drawables/Drawable";
import { Vec2, type IVec2 } from "../math";
import type { PIXIRenderer } from "../pixi";

export interface RendererOptions {
  size: IVec2;
  environment: FrameworkEnvironment;
  rendererPreference?: "webgl" | "webgpu";
}

export class Renderer {
  async init(options: RendererOptions) {
    const { autoDetectRenderer } = await import("pixi.js");
    const { size, environment, rendererPreference } = options;

    this.#size = Vec2.from(size);

    this.#internalRenderer = await autoDetectRenderer({
      preference: environment.webGpuSupported ? rendererPreference : "webgl",
      antialias: options.environment?.antialiasPreferred ?? true,
      width: this.#size.x,
      height: this.#size.y,
      autoDensity: true,
      useBackBuffer: true,
      powerPreference: "high-performance",
      hello: false,
      clearBeforeRender: true,
      depth: true,
    });
  }

  #internalRenderer?: PIXIRenderer;

  get internalRenderer() {
    if (!this.#internalRenderer) {
      throw new Error("Renderer not initialized");
    }
    return this.#internalRenderer;
  }

  render(drawable: Drawable) {
    this.internalRenderer.render(drawable.drawNode);
  }

  get canvas(): HTMLCanvasElement {
    return this.internalRenderer.canvas;
  }

  #size: Vec2 = Vec2.zero();

  get size(): Vec2 {
    return this.#size;
  }

  set size(value: IVec2) {
    if (this.#size.equals(value)) return;

    this.#size = Vec2.from(value);

    this.internalRenderer.resize(this.#size.x, this.#size.y);
  }
}
