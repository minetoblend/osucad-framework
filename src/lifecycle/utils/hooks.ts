import { getDrawableScope } from "../DrawableScope.ts";

export function onScopeDispose(callback: () => void) {
  getDrawableScope()?.addDestroyCallback(callback)
}