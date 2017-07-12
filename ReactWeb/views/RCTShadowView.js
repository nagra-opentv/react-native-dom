/**
 * @providesModule RCTShadowView
 * @flow
 */

import type { RCTComponent } from "RCTComponent";
import YogaNode from "yoga-js";

export const SHADOW_PROPS = [
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "minWidth",
  "maxWidth",
  "minHeight",
  "minWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderWidth",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginVertical",
  "marginHorizontal",
  "margin",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "paddingVertical",
  "paddingHorizontal",
  "padding",
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "alignSelf",
  "alignContent",
  "position",
  "aspectRatio",
  "overflow",
  "display"
];

const LAYOUT_PROPS = ["top", "left", "width", "height"];

type Layout = {
  top: number,
  left: number,
  width: number,
  height: number
};

class RCTShadowView implements RCTComponent {
  _backgroundColor: string;

  viewName: string;

  yogaNode: YogaNode;
  previousLayout: ?Layout;
  isNewView: boolean;
  isHidden: boolean;
  isDirty: boolean = true;

  reactTag: number;
  reactSubviews: Array<RCTShadowView> = [];
  reactSuperview: ?RCTShadowView;

  constructor() {
    this.yogaNode = new YogaNode();

    SHADOW_PROPS.forEach(shadowPropName => {
      Object.defineProperty(this, shadowPropName, {
        configurable: true,
        get: () => this.yogaNode.style[shadowPropName],
        set: value => {
          this.yogaNode.style[shadowPropName] = value;
          this.makeDirty();
          return true;
        }
      });
    });

    this.previousLayout = undefined;
  }

  get backgroundColor(): string {
    return this._backgroundColor;
  }

  set backgroundColor(value: string) {
    this._backgroundColor = value;
  }

  getLayoutChanges() {
    let layoutChanges = [];

    this.reactSubviews.forEach(subView => {
      if (subView.isDirty) {
        layoutChanges = layoutChanges.concat(subView.getLayoutChanges());
      }
    });

    const newLayout = this.yogaNode.layout;

    if (JSON.stringify(newLayout) !== JSON.stringify(this.previousLayout)) {
      const layoutChangeType =
        this.previousLayout === undefined ? "add" : "update";
      layoutChanges.push([this.reactTag, newLayout, layoutChangeType]);
      this.previousLayout = newLayout;
    }

    this.isDirty = false;
    return layoutChanges;
  }

  makeDirty(): void {
    let view = this;
    while (view.reactSuperview) {
      view = view.reactSuperview;
    }
    view.makeDirtyRecursive();
  }

  makeDirtyRecursive(): void {
    this.reactSubviews.forEach(subView => {
      subView.makeDirtyRecursive();
    });
    this.isDirty = true;
  }

  insertReactSubviewAtIndex(subview: RCTShadowView, index: number) {
    subview.reactSuperview = this;
    this.reactSubviews.splice(index, 0, subview);
    this.yogaNode.insertChild(subview.yogaNode, index);
    this.makeDirty();
  }

  removeReactSubview(subview: RCTShadowView) {
    subview.reactSuperview = undefined;
    this.reactSubviews = this.reactSubviews.filter(s => s !== subview);
    this.yogaNode.removeChild(subview.yogaNode);
    this.makeDirty();
  }

  purge() {
    this.yogaNode.freeRecursive();
  }

  // TODO: Implement ===========================================
  didSetProps(changedProps: Array<string>) {}
  didUpdateReactSubviews() {}
  reactTagAtPoint(point: { x: number, y: number }): number {
    return 0;
  }
}

export default RCTShadowView;