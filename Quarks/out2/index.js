var _frag;
import { element as _mu_element, child as _mu_child, choose as _mu_choose } from "mutraction-dom";
import { data } from "./data.js";
import { track, ForEach, Swapper } from "mutraction-dom";
let activeTab = 0;
const model = track({
  data: data,
  activeTab: 0,
  activeGroup: null,
  activeItem: null,
  activeFlavor: null,
  inventory: [],
  generators: []
});
function setTab(input) {
  console.log(data, model.data);
  model.activeTab = input;
  model.activeGroup = null;
  model.activeItem = null;
  model.activeFlavor = null;
}
function setGroup(input) {
  model.activeGroup = input;
  model.activeItem = null;
  model.activeFlavor = null;
  console.log('Group', input);
}
function setItem(input) {
  const item = model.activeGroup?.l.find(x => x.u && x.i === input);
  model.activeItem = item;
  model.activeFlavor = null;
  console.log('Item', input, item);
}
function setFlavor(input) {
  const flavor = model.activeItem?.f.find(x => x.i === input);
  model.activeFlavor = flavor;
  if (!flavor) {
    return;
  }
  alert(`flavor town ${flavor.n}!`);
}
function renderItemGroup(input) {
  return _mu_element("button", {}, {
    className: () => `itemGroup ${!input.u ? 'hide' : ''}`,
    onclick: () => () => setGroup(input)
  }, _mu_child(() => input.n));
}
function renderItemGroups() {
  return ForEach(model.data, x => renderItemGroup(x));
}
function renderItem(input) {
  return _mu_element("button", {}, {
    className: () => `item ${!input.u ? 'hide' : ''}`,
    onclick: () => () => setItem(input.i)
  }, _mu_child(() => input.n));
}
function renderItems() {
  return Swapper(() => ForEach(model.activeGroup?.l, x => renderItem(x)));
  // const container = <div></div> as HTMLDivElement;
  // effect(() => container.replaceChildren( 
  // ForEach(model.activeGroup?.l, x => renderItem(x)) 
  // ));
  // return container;
  //return ForEach(model.activeGroup?.l, x => renderItem(x));
}

function renderFlavor(input) {
  return _mu_element("button", {}, {
    className: () => `flavor ${!input.u ? 'hide' : ''}`,
    onclick: () => () => setFlavor(input.i)
  }, _mu_child(() => input.n));
}
function renderFlavors() {
  return Swapper(() => ForEach(model.activeItem?.f, x => renderFlavor(x)));
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