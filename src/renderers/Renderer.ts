import { FrameworkEnvironment } from "../FrameworkEnvironment";
import type { PIXIRenderer } from "../pixi";

export interface RendererOptions {
  environment: FrameworkEnvironment;
}

export class Renderer {
  async init() {
    const { autoDetectRenderer } = await import("pixi.js");

    this.#internalRenderer = await autoDetectRenderer({
      preference: "webgpu",
      antialias: true,
    });
  }

  #internalRenderer?: PIXIRenderer;

  get internalRenderer() {
    if (!this.#internalRenderer) {
      throw new Error("Renderer not initialized");
    }
    return this.#internalRenderer;
  }
}
