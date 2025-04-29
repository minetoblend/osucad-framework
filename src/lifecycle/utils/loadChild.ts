import { Container } from "pixi.js";
import { LifeCycleInternals } from "../LifeCycleMixin.ts";

export function loadChild(this: LifeCycleInternals, child: Container) {
  (child as LifeCycleInternals)._setup(this._scope)
}