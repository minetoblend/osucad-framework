import type { ILerp } from "../types/ILerp";

export class Vec2 implements ILerp<Vec2> {
  constructor();
  constructor(xy: number);
  constructor(x: number, y: number);
  constructor(public x: number = 0, public y: number = x) {}

  readonly(): Readonly<Vec2> {
    return this;
  }

  add(v: IVec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  addF(f: number): Vec2 {
    return new Vec2(this.x + f, this.y + f);
  }

  sub(v: IVec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  subF(f: number): Vec2 {
    return new Vec2(this.x - f, this.y - f);
  }

  mul(v: IVec2): Vec2 {
    return new Vec2(this.x * v.x, this.y * v.y);
  }

  mulF(f: number): Vec2 {
    return new Vec2(this.x * f, this.y * f);
  }

  div(v: IVec2): Vec2 {
    return new Vec2(this.x / v.x, this.y / v.y);
  }

  divF(f: number): Vec2 {
    return new Vec2(this.x / f, this.y / f);
  }

  dot(v: IVec2): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: IVec2): number {
    return this.x * v.y - this.y * v.x;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vec2 {
    const len = this.length();
    return new Vec2(this.x / len, this.y / len);
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(v: IVec2): number {
    return Math.atan2(this.cross(v), this.dot(v));
  }

  distance(v: IVec2): number {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  distanceSq(v: IVec2): number {
    return (this.x - v.x) ** 2 + (this.y - v.y) ** 2;
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  equals(v: IVec2): boolean {
    return this.x === v.x && this.y === v.y;
  }

  withX(x: number): Vec2 {
    return new Vec2(x, this.y);
  }

  withY(y: number): Vec2 {
    return new Vec2(this.x, y);
  }

  toString(): string {
    return `Vec2(${this.x}, ${this.y})`;
  }

  static from(v: IVec2): Vec2 {
    return new Vec2(v.x, v.y);
  }
  
  static zero(): Vec2 {
    return new Vec2(0);
  }

  lerp(target: Vec2, t: number): Vec2 {
    return new Vec2(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t
    );
  }
}

export interface IVec2 {
  x: number;
  y: number;
}
