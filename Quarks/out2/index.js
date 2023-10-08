var _frag;
import { element as _mu_element, child as _mu_child, choose as _mu_choose } from "mutraction-dom";
import { data, visibleGroups, visibleItems, visibleFlavors } from "./data.js";
import { track, ForEach } from "mutraction-dom";
let activeTab = 0;
const model = track({
  activeTab: 0,
  activeGroup: -1,
  activeItem: -1,
  activeFlavor: -1,
  inventory: [],
  generators: []
});
function currentFlavor() {
  return data.find(x => x.i === model.activeGroup)?.l.find(x => x.i === model.activeItem)?.f.find(x => x.i === model.activeFlavor);
}
function setTab(input) {
  model.activeTab = input;
  model.activeGroup = -1;
  model.activeItem = -1;
  model.activeFlavor = -1;
}
function setGroup(input) {
  model.activeGroup = input;
  model.activeItem = -1;
  model.activeFlavor = -1;
  console.log('Group', input, visibleItems(model.activeGroup));
}
function setItem(input) {
  model.activeItem = input;
  model.activeFlavor = -1;
  console.log('Item', input, visibleFlavors(model.activeGroup, model.activeItem));
}
function setFlavor(input) {
  model.activeFlavor = input;
  const flavor = currentFlavor();
  if (!flavor) {
    return;
  }
  alert(`flavor town ${flavor.n}!`);
}
function renderItemGroup(input) {
  return _mu_element("button", {
    className: "itemGroup"
  }, {
    onclick: () => () => setGroup(input.i)
  }, _mu_child(() => input.n));
}
function renderItemGroups() {
  return ForEach(visibleGroups(), x => renderItemGroup(x));
}
function renderItem(input) {
  return _mu_element("button", {
    className: "item"
  }, {
    onclick: () => () => setItem(input.i)
  }, _mu_child(() => input.n));
}
function renderItems() {
  return ForEach(visibleItems(model.activeGroup), x => renderItem(x));
}
function renderFlavor(input) {
  return _mu_element("button", {
    className: "flavor"
  }, {
    onclick: () => () => setFlavor(input.i)
  }, _mu_child(() => input.n));
}
function renderFlavors() {
  return ForEach(visibleFlavors(model.activeGroup, model.activeItem), x => renderFlavor(x));
}
function renderComponentItem(input) {}
function renderInventoryItem(input) {}
function renderGenerator(input) {}
const app = (_frag = document.createDocumentFragment(), _frag.append(_mu_element("h1", {}, {}, "Quarks"), _mu_element("div", {}, {}, _mu_element("button", {}, {
  onclick: () => () => setTab(0)
}, "Generate"), _mu_element("button", {}, {
  onclick: () => () => setTab(1)
}, "Discover"), _mu_element("button", {}, {
  onclick: () => () => setTab(2)
}, "Settings")), _mu_choose({
  nodeGetter: () => _mu_element("div", {
    className: "generate"
  }, {}, _mu_element("div", {
    className: "itemGroups"
  }, {}, _mu_child(() => renderItemGroups())), _mu_element("div", {
    className: "items"
  }, {}, _mu_child(() => renderItems())), _mu_element("div", {
    className: "flavors"
  }, {}, _mu_child(() => renderFlavors()))),
  conditionGetter: () => model.activeTab === 0
}), _mu_choose({
  nodeGetter: () => _mu_element("div", {
    className: "discover"
  }, {}, "Discover"),
  conditionGetter: () => model.activeTab === 1
}), _mu_choose({
  nodeGetter: () => _mu_element("div", {
    className: "settings"
  }, {}, "Settings"),
  conditionGetter: () => model.activeTab === 2
})), _frag);
document.body.append(app);