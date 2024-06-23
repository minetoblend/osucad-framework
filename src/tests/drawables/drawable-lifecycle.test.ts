import { DependencyContainer } from "../../di/DependencyContainer";
import { LoadState } from "../../graphics/drawables/Drawable";
import { Container } from "../../graphics/drawables/containers/Container";

describe("drawable lifecycle", () => {
  it('loads a drawable', () => {
    class TestDrawable extends Container {
      override onLoad() {
        expect(this.loadState).toBe(LoadState.Loading)
      }
    }
    
    const drawable = new TestDrawable()

    expect(drawable.loadState).toBe(LoadState.NotLoaded)

    drawable.load(new DependencyContainer())

    expect(drawable.loadState).toBe(LoadState.Ready)

    drawable.updateSubTree()

    expect(drawable.loadState).toBe(LoadState.Loaded)
  })

  it('loads children', () => {
    let child: Container;

    const parent = Container.create({
      child: child = Container.create()
    })

    expect(parent.loadState).toBe(LoadState.NotLoaded)
    expect(child.loadState).toBe(LoadState.NotLoaded)

    parent.load(new DependencyContainer())

    expect(parent.loadState).toBe(LoadState.Ready)
    expect(child.loadState).toBe(LoadState.Ready)

    parent.updateSubTree()

    expect(parent.loadState).toBe(LoadState.Loaded)
    expect(child.loadState).toBe(LoadState.Loaded)
  })

  it('loads a child when added if already loaded', () => {
    const parent = Container.create()
    const child = Container.create()

    parent.load(new DependencyContainer())

    parent.add(child)

    expect(parent.loadState).toBe(LoadState.Ready)
    expect(child.loadState).toBe(LoadState.Ready)

    parent.updateSubTree()

    expect(parent.loadState).toBe(LoadState.Loaded)
    expect(child.loadState).toBe(LoadState.Loaded)
  })

  it('loads a child when added during loading', () => {
    let child: Container;
    class TestContainer extends Container {
      override onLoad() {
        child = this.add(Container.create())
      }
    }

    const parent = new TestContainer()

    parent.load(new DependencyContainer())

    expect(parent.loadState).toBe(LoadState.Ready)
    expect(child!.loadState).toBe(LoadState.Ready)

    parent.updateSubTree()

    expect(parent.loadState).toBe(LoadState.Loaded)
    expect(child!.loadState).toBe(LoadState.Loaded)
  })

  it('does not load a child when added if not loaded', () => {
    const parent = Container.create()
    const child = Container.create()

    parent.add(child)

    expect(parent.loadState).toBe(LoadState.NotLoaded)
    expect(child.loadState).toBe(LoadState.NotLoaded)
  })

  it('throws if trying to update when not loaded', () => {
    const drawable = new Container()

    expect(() => drawable.updateSubTree()).toThrow()
  })
});
