import { DependencyContainer } from "../../di/DependencyContainer";
import { Axes } from "../../graphics/drawables/Axes";
import { Container } from "../../graphics/drawables/containers/Container";

describe('composite drawable layout', () => {
  it('correctly calculates child offset', () => {
    const parent = Container.create({
      width: 100,
      height: 100,
      padding: { horizontal: 10, vertical: 20 },
    });

    expect(parent.childOffset).toEqual({ x: 10, y: 20 });

    parent.padding = { horizontal: 20, vertical: 30 };

    expect(parent.childOffset).toEqual({ x: 20, y: 30 });
  })

  it('correctly calculates child size', () => {
    const parent = Container.create({
      width: 100,
      height: 100,
      padding: { horizontal: 10, vertical: 20 },
    });

    expect(parent.childSize).toEqual({ x: 80, y: 60 });

    parent.width = 200;

    expect(parent.childSize).toEqual({ x: 180, y: 60 });
  })

  it('correctly positions children', () => {
    let child: Container;
    const parent = Container.create({
      width: 100,
      height: 100,
      padding: { horizontal: 10, vertical: 20 },
      children: [
        child = Container.create({
          width: 50,
          height: 50,
        })
      ]
    });

    child.updateDrawNodeTransform();

    expect(child.drawNodePosition).toEqual({ x: 10, y: 20 });

    parent.padding = { horizontal: 20, vertical: 30 };

    child.updateDrawNodeTransform();

    expect(child.drawNodePosition).toEqual({ x: 20, y: 30 });
  })

  it('automatically updates children on invalidation', () => {
    let child: Container;

    const parent = Container.create({
      width: 100,
      height: 100,
      padding: { horizontal: 10, vertical: 20 },
      label: "parent",
      children: [
        child = Container.create({
          width: 50,
          height: 50,
          label: "child",
        })
      ]
    });

    parent.load(new DependencyContainer());

    parent.updateSubTree();

    expect(child.drawNodePosition).toEqual({ x: 10, y: 20 });

    parent.padding = { horizontal: 20, vertical: 30 };

    parent.updateSubTree();

    expect(child.drawSize).toEqual({ x: 50, y: 50 });
    expect(child.drawNodePosition).toEqual({ x: 20, y: 30 });

    child.relativeSizeAxes = Axes.X;
    child.width = 0.25;

    parent.updateSubTree();

    expect(child.drawSize).toEqual({ x: 15, y: 50 });
    expect(child.drawNodePosition).toEqual({ x: 20, y: 30 });

    child.relativeSizeAxes = Axes.Both;
    child.height = 0.5;

    parent.updateSubTree();

    expect(child.drawSize).toEqual({ x: 15, y: 20 });
    expect(child.drawNodePosition).toEqual({ x: 20, y: 30 });
  })
})