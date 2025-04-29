import { Application, ExtensionMetadata, extensions, ExtensionType, System } from "pixi.js";
import { LifeCycleInternals } from "./LifeCycleMixin.ts";

export class LifeCycleSystem implements System {
  public static readonly extension: ExtensionMetadata = ExtensionType.Application

  public static init(this: Application) {
    (this.stage as LifeCycleInternals)._setup()
  }
}

extensions.add(LifeCycleSystem)