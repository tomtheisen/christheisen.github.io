var _frag2;
import { element as _mu_element, child as _mu_child, choose as _mu_choose } from "mutraction-dom";
//TODO: manage all auto-generators somewhere?
//Or just show the input/output of an item?
//TODO: item builder/suggestioner in Discovery
//update stuff
//generate button
//visible groups
//generator
//tick - 100ms / every 1000ms do a thing
//allow for catch-up speed
//save/load
//inventory {f.name, amount}
//generators {f.name, level, enabled}
//unlocked groups/items
//time
//Discovery?
//item builder/suggestion
var Tabs;
(function (Tabs) {
  Tabs[Tabs["Generate"] = 0] = "Generate";
  Tabs[Tabs["Discover"] = 1] = "Discover";
  Tabs[Tabs["Settings"] = 2] = "Settings";
  Tabs[Tabs["Help"] = 3] = "Help";
})(Tabs || (Tabs = {}));
;
const tabButtons = {};
let menu = document.getElementById('menu');
const saveRate = 10; //updates per save
const tickRate = 100; //ms
const updateRate = 1000; //ms
import { data, ItemMap, FlavorMap, ComponentMap, buildMaps, load, save } from "./data.js";
import { track, ForEach, Swapper } from "mutraction-dom";
let activeTab = 0;
const model = track({
  data: data,
  activeTab: 0,
  activeGroup: undefined,
  activeItem: undefined,
  activeFlavor: undefined,
  activeInventoryItem: undefined,
  inventory: [],
  generators: [],
  recipeSearchResults: [],
  loadingStatus: 'Loading',
  interval: 0,
  gameClock: 0,
  lastUpdate: 0,
  lastSave: 0
});
function generatorCost(input) {
  const item = FlavorMap[input.f.n];
  return (10 ** item.g) ** input.l;
}
function findInventoryItem(input) {
  const temp = model.inventory.find(x => x.f === input);
  if (temp) {
    return temp;
  }
  const newInvItem = {
    f: input,
    a: 0
  };
  model.inventory.push(newInvItem);
  return findInventoryItem(input);
}
function findGenerator(input) {
  const temp = model.generators.find(x => x.f === input);
  if (temp) {
    return temp;
  }
  const newGenerator = {
    f: input,
    l: 0,
    a: true
  };
  model.generators.push(newGenerator);
  return newGenerator;
}
function recipeSearch(input) {
  model.recipeSearchResults.length = 0;
  const c = ComponentMap[input.n];
  c.forEach(f => {
    const i = FlavorMap[f.n];
    const g = ItemMap[i.n];
    model.recipeSearchResults.push({
      g: g,
      i: i,
      f: f
    });
  });
}
function hasComponents(input) {
  let output = true;
  input.c.forEach(c => {
    const inv = findInventoryItem(c.f);
    if (inv.a < c.a) {
      output = false;
    }
  });
  return output;
}
function generate(input, adjustment = 0) {
  //find generator
  const gen = findGenerator(input.f);
  if (!gen) {
    return;
  }
  if (!hasComponents(input.f)) {
    return;
  }
  const i = FlavorMap[input.f.n];
  i.u = true;
  ItemMap[i.n].u = true;
  input.f.c.forEach(c => {
    const inv = findInventoryItem(c.f);
    inv.a -= c.a;
  });
  input.a += gen.l + adjustment;
  return;
}
function upgradeGenrator(input) {
  const gen = findGenerator(input);
  const inv = findInventoryItem(input);
  const cost = generatorCost(gen);
  if (inv.a < cost) {
    return;
  }
  gen.l++;
  inv.a -= cost;
}
function setTab(input) {
  Object.values(tabButtons).forEach(x => x.classList.remove('selected'));
  tabButtons[`tab_${input}`].classList.add('selected');
  model.activeTab = input;
  model.activeGroup = undefined;
  model.activeItem = undefined;
  model.activeFlavor = undefined;
  model.recipeSearchResults.length = 0;
}
function setGroup(input) {
  model.activeGroup = input;
  model.activeItem = undefined;
  model.activeFlavor = undefined;
  model.recipeSearchResults.length = 0;
}
function setItem(input) {
  model.activeItem = input;
  model.activeFlavor = undefined;
  model.recipeSearchResults.length = 0;
}
function setFlavor(input) {
  model.activeFlavor = input;
  model.recipeSearchResults.length = 0;
  model.activeInventoryItem = findInventoryItem(model.activeFlavor);
}
function gotoFlavor(input) {
  const i = FlavorMap[input.n];
  const g = ItemMap[i.n];
  setTab(Tabs.Generate);
  setGroup(g);
  setItem(i);
  setFlavor(input);
}
function gotoItem(input) {
  const g = ItemMap[input.n];
  setTab(Tabs.Generate);
  setGroup(g);
  setItem(input);
}
function renderItemGroups() {
  return ForEach(model.data, x => _mu_element("button", {}, {
    className: () => `itemGroup${!x.u ? ' hide' : ''}${x === model.activeGroup ? ' selected' : ''}`,
    onclick: () => () => setGroup(x)
  }, _mu_child(() => x.n)));
}
function renderItems() {
  return ForEach(() => model.activeGroup?.c ?? [], x => _mu_element("button", {}, {
    className: () => `item${!x.u ? ' hide' : ''}${x === model.activeItem ? ' selected' : ''}`,
    onclick: () => () => setItem(x)
  }, _mu_child(() => x.n)));
}
function renderFlavors() {
  return ForEach(() => model.activeItem?.c ?? [], x => _mu_element("button", {}, {
    className: () => `flavor${!x.u ? ' hide' : ''}${x === model.activeFlavor ? ' selected' : ''}`,
    onclick: () => () => setFlavor(x)
  }, _mu_child(() => x.n)));
}
function renderGenerateButton(input) {
  const i = FlavorMap[input.f.n];
  const canDo = hasComponents(input.f);
  const className = `generateButton${!canDo ? ' disabled' : ''}`;
  return _mu_element("button", {}, {
    className: () => className,
    onclick: () => () => generate(input, 1)
  }, "Generate");
}
function renderActiveFlavor() {
  return Swapper(() => renderFlavor(model.activeFlavor));
}
function renderFlavor(input) {
  var _frag;
  const inv = findInventoryItem(input);
  const i = FlavorMap[input.n];
  const g = ItemMap[i.n];
  return _frag = document.createDocumentFragment(), _frag.append(_mu_element("div", {
    className: "row"
  }, {}, _mu_element("div", {
    className: "cell block"
  }, {}, _mu_element("div", {
    className: "title"
  }, {}, "Inventory"), _mu_element("div", {}, {
    style: () => ({
      display: 'flex'
    })
  }, _mu_element("div", {}, {}, _mu_child(() => renderGenerateButton(inv)), _mu_element("div", {
    className: "ownedItem"
  }, {}, "Owned: ", _mu_child(() => inv?.a ?? 0))))), _mu_element("div", {
    className: "cell block"
  }, {}, _mu_element("div", {
    className: "title"
  }, {}, "Generator"), _mu_child(() => renderGenerator(input))), _mu_element("div", {
    className: "cell block"
  }, {}, _mu_element("div", {
    className: "title"
  }, {}, "Components"), _mu_element("div", {}, {}, _mu_element("div", {}, {}, _mu_child(() => model.activeFlavor?.c?.length ? ForEach(() => model.activeFlavor?.c ?? [], x => renderComponentItem(x)) : _mu_element("span", {}, {}, "This is an elementary particle, it does not have components.")))))), _mu_element("div", {}, {}, _mu_element("div", {
    className: "block"
  }, {}, _mu_element("div", {
    className: "title"
  }, {}, "Used in"), _mu_choose({
    nodeGetter: () => _mu_element("div", {}, {}, _mu_element("p", {}, {}, " Spoiler Alert: This will show all items this item is a component for; including ones you have not unlocked yet. If you want to find everything the hard way then don't click. "), _mu_element("button", {}, {
      onclick: () => () => recipeSearch(input)
    }, "Search")),
    conditionGetter: () => !model.recipeSearchResults.length
  }), _mu_choose({
    nodeGetter: () => _mu_element("div", {}, {}, _mu_child(() => Swapper(() => renderSearchResults()))),
    conditionGetter: () => !!model.recipeSearchResults.length
  })))), _frag;
}
function renderComponentItem(input) {
  const inv = findInventoryItem(input.f);
  const i = FlavorMap[input.f.n];
  const g = ItemMap[i.n];
  if (!g || !i) {
    return _mu_element("li", {}, {}, "component not found");
  }
  return _mu_element("div", {
    className: "row"
  }, {}, _mu_element("div", {
    className: "cell"
  }, {}, _mu_child(() => g.n), ".", _mu_child(() => i.n), ".", _mu_child(() => input.f.n)), _mu_element("div", {
    className: "cell"
  }, {}, _mu_element("button", {}, {
    onclick: () => () => gotoFlavor(input.f)
  }, "\u2192")), _mu_element("div", {
    className: "cell"
  }, {}, " Owned:", _mu_child(() => inv.a), " / Need:", _mu_child(() => input.a)), _mu_element("div", {
    className: "cell"
  }, {}, _mu_child(() => renderGenerateButton(inv))));
}
function renderInventoryItem(input) {
  const inv = findInventoryItem(input.f);
  return _mu_element("div", {
    className: "inventoryItem"
  }, {}, "`$", _mu_child(() => input.f.n), " Owned: $", _mu_child(() => inv?.a ?? 0), "`");
}
function renderGenerator(input) {
  if (!input) {
    return _mu_element("div", {
      className: "hide"
    }, {});
  }
  const gen = findGenerator(input);
  if (!gen) {
    return _mu_element("div", {
      className: "generator"
    }, {}, "Empty");
  }
  return _mu_element("div", {}, {}, _mu_element("div", {
    className: "generator"
  }, {}, _mu_element("div", {}, {}, _mu_element("button", {}, {
    onclick: () => () => upgradeGenrator(input)
  }, "Upgrade", _mu_element("br", {}, {}), "(", _mu_child(() => generatorCost(gen)), ")")), _mu_element("div", {}, {}, _mu_element("div", {
    className: "nowrap"
  }, {}, _mu_element("label", {}, {
    htmlFor: () => `chkGen${input.n}`
  }, "Enabled:"), _mu_element("input", {
    type: "checkbox"
  }, {
    id: () => `chkGen${input.n}`,
    checked: () => gen.a,
    onchange: () => () => gen.a = !gen.a
  })), _mu_element("div", {
    className: "nowrap"
  }, {}, "Level: ", _mu_child(() => gen.l)))), _mu_element("div", {}, {}, "This will generate up to ", _mu_child(() => gen.l), " items every tick."));
}
function renderSearchResults() {
  return ForEach(() => model.recipeSearchResults, x => {
    const inv = findInventoryItem(x.f);
    return _mu_element("p", {}, {}, _mu_element("div", {
      className: "row"
    }, {}, _mu_element("div", {
      className: "cell"
    }, {}, _mu_child(() => x.g.n), ".", _mu_child(() => x.i.n), ".", _mu_child(() => x.f.n)), _mu_choose({
      nodeGetter: () => _mu_element("div", {
        className: "cell"
      }, {}, _mu_element("button", {}, {
        onclick: () => () => gotoItem(x.i)
      }, "\u2192")),
      conditionGetter: () => x.i.u
    }), _mu_element("div", {
      className: "cell"
    }, {}, _mu_child(() => renderGenerateButton(inv)))), _mu_element("ul", {
      className: "componentList"
    }, {}, _mu_child(() => ForEach(() => x.f.c, y => renderComponentItem(y)))));
  });
}
function mainLoop() {
  const now = performance.now();
  model.gameClock += now - model.lastUpdate;
  model.lastUpdate = now;
  //avoid getting stuck if some other need to happen
  let maxCycles = 100;
  while (model.gameClock > updateRate && maxCycles--) {
    model.gameClock -= updateRate;
    //do generates
    model.generators.forEach(x => {
      if (!x.a) {
        return;
      }
      const inv = findInventoryItem(x.f);
      generate(inv);
    });
    //sometimes save
    if (--model.lastSave <= 0) {
      save();
      model.lastSave = saveRate;
    }
  }
}
function init() {
  model.loadingStatus = 'Loading Game Data';
  buildMaps();
  model.loadingStatus = 'Loading Save Data';
  load();
  model.loadingStatus = 'Starting Game';
  model.lastUpdate = performance.now();
  model.interval = setInterval(mainLoop, tickRate);
  menu = document.getElementById('menu');
  for (const tab in Tabs) {
    const t = `tab_${tab}`;
    const e = document.getElementById(t);
    if (!e) {
      continue;
    }
    tabButtons[t] = e;
  }
}
const app = (_frag2 = document.createDocumentFragment(), _frag2.append(_mu_choose({
  nodeGetter: () => _mu_element("div", {
    className: "loading"
  }, {}, _mu_child(() => model.loadingStatus)),
  conditionGetter: () => !model.interval
}, {
  nodeGetter: () => _mu_element("div", {}, {}, _mu_element("h1", {}, {}, "Quarks"), _mu_element("div", {
    id: "menu"
  }, {}, _mu_element("button", {
    className: "selected"
  }, {
    id: () => `tab_${Tabs.Generate}`,
    onclick: () => () => setTab(Tabs.Generate)
  }, "Generate"), _mu_element("button", {}, {
    id: () => `tab_${Tabs.Discover}`,
    onclick: () => () => setTab(Tabs.Discover)
  }, "Discover"), _mu_element("button", {}, {
    id: () => `tab_${Tabs.Settings}`,
    onclick: () => () => setTab(Tabs.Settings)
  }, "Settings"), _mu_element("button", {}, {
    id: () => `tab_${Tabs.Help}`,
    onclick: () => () => setTab(Tabs.Help)
  }, "Help")), _mu_choose({
    nodeGetter: () => _mu_element("div", {
      className: "generate"
    }, {}, _mu_element("div", {
      className: "itemGroups"
    }, {}, _mu_child(() => renderItemGroups())), _mu_element("div", {
      className: "items"
    }, {}, _mu_child(() => renderItems()), _mu_choose({
      nodeGetter: () => _mu_element("p", {}, {}, _mu_child(() => model.activeItem?.info)),
      conditionGetter: () => !!model.activeItem
    })), _mu_element("div", {
      className: "flavors"
    }, {}, _mu_child(() => renderFlavors())), _mu_choose({
      nodeGetter: () => _mu_element("div", {
        className: "activeFlavor"
      }, {}, _mu_child(() => renderActiveFlavor())),
      conditionGetter: () => !!model.activeFlavor
    })),
    conditionGetter: () => model.activeTab === Tabs.Generate
  }), _mu_choose({
    nodeGetter: () => _mu_element("div", {
      className: "discover"
    }, {}, "Discover : unlock new items in the generate tab.", _mu_element("ul", {}, {}, _mu_element("li", {}, {}, "filter items?"), _mu_element("li", {}, {}, "add items to 'crafting table'?"), _mu_element("li", {}, {}, "test create? (no penalty)")), _mu_element("div", {}, {}, _mu_element("h3", {}, {}, "Inventory"), _mu_element("div", {}, {}, _mu_child(() => ForEach(model.inventory, x => renderInventoryItem(x))))), _mu_element("div", {}, {})),
    conditionGetter: () => model.activeTab === Tabs.Discover
  }), _mu_choose({
    nodeGetter: () => _mu_element("div", {
      className: "settings"
    }, {}, "Settings", _mu_element("ul", {}, {}, _mu_element("li", {}, {}, "show/hide info"), _mu_element("li", {}, {}, "save/load"), _mu_element("li", {}, {}, "hard reset game"), _mu_element("li", {}, {}, "infinite mode (all unlocked, infinite of g0-g3? items)"), _mu_element("li", {}, {}, "auto search on flavor click"), _mu_element("li", {}, {}), _mu_element("li", {}, {}))),
    conditionGetter: () => model.activeTab === Tabs.Settings
  }), _mu_choose({
    nodeGetter: () => _mu_element("div", {
      className: "help"
    }, {}, "Help", _mu_element("ul", {}, {}, _mu_element("li", {}, {}, "Buttons"), _mu_element("li", {}, {}, "Generating"), _mu_element("li", {}, {}, "Discovery"), _mu_element("li", {}, {}, "about"))),
    conditionGetter: () => model.activeTab === Tabs.Help
  }), _mu_element("br", {}, {}), _mu_element("div", {
    className: "mutraction"
  }, {}, "Made with ", _mu_element("a", {
    href: "https://mutraction.dev/",
    target: "_blank"
  }, {}, "\u03BCtraction")))
})), _frag2);
document.body.append(app);
init();