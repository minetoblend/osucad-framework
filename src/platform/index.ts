import type { InjectionToken } from "../di/DependencyContainer";
import type { GameHost } from "./GameHost";

export { GameHost, ExecutionState, type GameHostOptions } from "./GameHost";
export { WebGameHost } from "./WebGameHost";

export const GAME_HOST: InjectionToken<GameHost> = Symbol("GameHost");