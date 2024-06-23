export const enum Anchor {
  x0 = 1,
  x1 = 2,
  x2 = 3,

  y0 = 4,
  y1 = 5,
  y2 = 6,

  Custom = 7,

  TopLeft = x0 | y0,
  TopCenter = x1 | y0,
  TopRight = x2 | y0,

  CenterLeft = x0 | y1,
  Center = x1 | y1,
  CenterRight = x2 | y1,

  BottomLeft = x0 | y2,
  BottomCenter = x1 | y2,
  BottomRight = x2 | y2,
}

export function anchorToString(anchor: Anchor) {
  switch (anchor) {
    case Anchor.Custom: return "Custom";
    case Anchor.TopLeft: return "TopLeft";
    case Anchor.TopCenter: return "TopCenter";
    case Anchor.TopRight: return "TopRight";
    case Anchor.CenterLeft: return "CenterLeft";
    case Anchor.Center: return "Center";
    case Anchor.CenterRight: return "CenterRight";
    case Anchor.BottomLeft: return "BottomLeft";
    case Anchor.BottomCenter: return "BottomCenter";
    case Anchor.BottomRight: return "BottomRight";
    default: throw new Error(`Unknown anchor type: ${anchor}`);
  }
}