import './lifecycle'
import { Application, Container } from "pixi.js";
import { inject, provide } from "./lifecycle";

const app = new Application()

await app.init({
  resizeTo: window,
  autoDensity: true,
  resolution: devicePixelRatio,
  antialias: false,
})

class Foo extends Container {
  setup() {
    provide(Foo, this)

    this.addChild(new Bar())
  }
}

class Bar extends Container {
  setup() {
    const foo = inject(Foo, false)

    console.log(foo)
  }
}

app.stage.addChild(new Foo())
