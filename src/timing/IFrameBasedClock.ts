import type { FrameTimeInfo } from "../graphics/transforms/FrameTimeInfo";
import type { IClock } from "./IClock";

export interface IFrameBasedClock extends IClock {
  get elapsedFrameTime(): number;

  get framesPerSecond(): number;

  get timeInfo(): FrameTimeInfo;

  processFrame(): void;
}