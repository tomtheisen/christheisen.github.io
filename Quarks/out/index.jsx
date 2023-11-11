//GETTING SOME LAG AFTER ONLY A FEW GENERATORS!
//Test: 
//remove the defaultTypes
//inventory/generators back to arrays
//tab doesn't highlight correctly.
//able to downgrade generators?
//save/load
//save/load object
//inventory {f.name, amount}
//generators {f.name, level, enabled}
//unlocked groups/items
//time
//settings
//settings object in model
//help
//manage all auto-generators somewhere?
//Or just show the input/output of an item?
//hotkeys (go by row, might not work for things like all the Items &| Flavors for atomic and beyond)
//maybe just first couple rows? or use arrows + up/down
//1234...
//qwerty...
//asffg...
//zxvbm...
//Discovery?
//figure out how this is going to work
//item builder/suggestion?
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
import { data, buildMaps, load, save } from "./data.js";
import { ItemMap, FlavorMap, ComponentMap, defaultSettings, defaultItemGroup, defaultItem, defaultFlavor, defaultFlavorAmount } from "./types.js";
import { track, ForEach, Swapper } from "mutraction-dom";
let activeTab = 0;
const model = track({
    data: data,
    activeTab: 0,
    activeGroup: defaultItemGroup,
    activeItem: defaultItem,
    activeFlavor: defaultFlavor,
    activeFlavorAmount: defaultFlavorAmount,
    inventory: {},
    generators: {},
    recipeSearchResults: [],
    loadingStatus: 'Loading',
    interval: 0,
    gameClock: 0,
    lastUpdate: 0,
    lastSave: 0,
    settings: defaultSettings
});
function generatorCost(input) {
    const item = FlavorMap[input.f.n];
    return (2 ** item.g) ** input.a;
}
function findInventoryItem(input) {
    if (!model.inventory[input.n]) {
        model.inventory[input.n] = { f: input, a: 0 };
    }
    return model.inventory[input.n];
}
function findGenerator(input) {
    if (!model.generators[input.n]) {
        const ci = input.c.map(x => ({ c: x, i: model.inventory[x.f.n] }));
        model.generators[input.n] = { f: input, a: 0, e: true, ci: ci };
    }
    return model.generators[input.n];
}
function recipeSearch(input) {
    model.recipeSearchResults.length = 0;
    const c = ComponentMap[input.n];
    c.forEach(f => {
        const i = FlavorMap[f.n];
        const g = ItemMap[i.n];
        model.recipeSearchResults.push({ g: g, i: i, f: f });
    });
}
function hasComponents(input) {
    let output = true;
    input.c.forEach(c => {
        const inv = findInventoryItem(c.f);
        if (inv.a < c.a) {
            output = false;
            return;
        }
    });
    return output;
}
function generateClick(input) {
    const componentInventory = input.f.c.map(x => ({ c: x, i: findInventoryItem(x.f) }));
    let amount = 1;
    componentInventory.forEach(x => amount = Math.min(Math.floor(x.i.a / x.c.a), amount));
    if (amount <= 0) {
        return;
    }
    //If this is a new item it needs to be unlocked. 
    //This is different than the generator's generate.
    const i = FlavorMap[input.f.n];
    i.u = true;
    ItemMap[i.n].u = true;
    componentInventory.forEach(x => x.i.a -= x.c.a);
    findInventoryItem(input.f).a += 100;
}
function generate(input, amount) {
    //testing pre-computing this and saving it on the generator.
    //const componentInventory = input.f.c.map(x => ({c: x, i: model.inventory[x.f]}));
    input.ci.forEach(x => amount = Math.min(Math.floor(x.i.a / x.c.a), amount));
    if (amount <= 0) {
        return;
    }
    input.ci.forEach(x => x.i.a -= x.c.a * amount);
    findInventoryItem(input.f).a += amount;
}
function upgradeGenrator(input) {
    const gen = findGenerator(input);
    const inv = findInventoryItem(input);
    const cost = generatorCost(gen);
    if (inv.a < cost) {
        return;
    }
    gen.a++;
    inv.a -= cost;
}
function setTab(input) {
    Object.values(tabButtons).forEach(x => x.classList.remove('selected'));
    tabButtons[`tab_${input}`].classList.add('selected');
    model.activeTab = input;
    model.activeGroup = defaultItemGroup;
    model.activeItem = defaultItem;
    model.activeFlavor = defaultFlavor;
    model.recipeSearchResults.length = 0;
}
function setGroup(input) {
    model.activeGroup = input;
    model.activeItem = defaultItem;
    model.activeFlavor = defaultFlavor;
    model.recipeSearchResults.length = 0;
}
function setItem(input) {
    model.activeItem = input;
    model.activeFlavor = defaultFlavor;
    model.recipeSearchResults.length = 0;
}
function setFlavor(input) {
    model.activeFlavor = input;
    model.recipeSearchResults.length = 0;
    model.activeFlavorAmount = findInventoryItem(model.activeFlavor);
}
function gotoFlavor(input) {
    const i = FlavorMap[input.n];
    const g = ItemMap[i.n];
    setTab(Tabs.Generate);
    setGroup(g);
    setItem(i);
    setFlavor(input);
}
function renderItemGroups() {
    return ForEach(model.data, x => <button className={`itemGroup${!x.u ? ' hide' : ''}${x === model.activeGroup ? ' selected' : ''}`} onclick={() => setGroup(x)}>{x.n}</button>);
}
function renderItems() {
    return ForEach(() => model.activeGroup?.c ?? [], x => <button className={`item${!x.u ? ' hide' : ''}${x === model.activeItem ? ' selected' : ''}`} onclick={() => setItem(x)}>{x.n}</button>);
}
function renderFlavors() {
    return ForEach(() => model.activeItem?.c ?? [], x => <button className={`flavor${!x.u ? ' hide' : ''}${x === model.activeFlavor ? ' selected' : ''}`} onclick={() => setFlavor(x)}>{x.n}</button>);
}
function renderGenerateButton(input) {
    const i = FlavorMap[input.f.n];
    const canDo = hasComponents(input.f);
    const className = `generateButton${!canDo ? ' disabled' : ''}`;
    return <button title={`Generate a ${input.f.n}`} className={className} onclick={() => generateClick(input)}>++</button>;
}
function renderActiveFlavor() {
    if (!model.activeFlavor) {
        return <div className='hide'></div>;
    }
    const input = model.activeFlavor;
    const inv = findInventoryItem(input);
    const i = FlavorMap[input.n];
    const g = ItemMap[i.n];
    return <>
		<div className='row'>
			<div className='cell block'>
				<div className='title'>Inventory</div>
				<div style={{ display: 'flex' }}>
					<div>
						<div className='ownedItem'>Owned: {inv?.a ?? 0} {renderGenerateButton(inv)}</div>
					</div>
				</div>
			</div>
			<div className='cell block'>
				<div className='title'>Generator</div>
				{renderGenerator(input)}
			</div>
			<div className='cell block'>
				<div className='title'>Components</div>
				<div>
					<div>{model.activeFlavor?.c?.length ?
            ForEach(() => model.activeFlavor?.c ?? [], x => renderFlavorAmount(x, 2)) :
            <span>This is an elementary particle, it does not have components.</span>}
					</div>
				</div>
			</div>
		</div>
		<div>
			<div className='block'>
				<div className='title'>Used in</div>
				<div mu:if={!model.recipeSearchResults.length}>
					<p>
						Spoiler Alert: This will show all items this item is a component for; including ones you have not unlocked yet.
						If you want to find everything the hard way then don't click.
					</p>
					<button onclick={() => recipeSearch(input)}>
						Search
					</button>
				</div>
				<div mu:if={!!model.recipeSearchResults.length}>
					{Swapper(() => renderSearchResults())}
				</div>
			</div>
		</div>
	</>;
}
//1: inventory, 2: flavor component
//a bit smelly, but these ended up being almost exactly the same.
function renderFlavorAmount(input, type) {
    const inv = type === 1 ? input : findInventoryItem(input.f);
    const i = FlavorMap[input.f.n];
    const g = ItemMap[i.n];
    let amount = `Owned:${inv.a}`;
    if (type === 2) {
        amount += ` / Need:${input.a}`;
    }
    ;
    return <div className='row'>
		<div className='cell'><button title={`Go To ${g.n}.${i.n}.${input.f.n}`} className='goto' onclick={() => gotoFlavor(input.f)}>»</button></div>
		<div className='cell'>{g.n}.{i.n}.{input.f.n}</div>
		<div className='cell'>{amount}</div>
		<div className='cell'>{renderGenerateButton(inv)}</div>
	</div>;
}
function renderGenerator(input) {
    if (!input) {
        return <div className='hide'></div>;
    }
    const gen = findGenerator(input);
    if (!gen) {
        return <div className='generator'>Empty</div>;
    }
    return <div>
		<div className='generator'>
			<div>
				<button onclick={() => upgradeGenrator(input)}>Upgrade<br />({generatorCost(gen)})</button>
			</div>
			<div>
				<div className='nowrap'>
					<label htmlFor={`chkGen${input.n}`}>Enabled:</label>
					<input id={`chkGen${input.n}`} type='checkbox' checked={gen.e} onchange={() => gen.e = !gen.e}/>
				</div>
				<div className='nowrap'>Level: {gen.a}</div>
			</div>
		</div>
		<div>
			This will generate up to {gen.a} items every tick.
		</div>
	</div>;
}
function renderSearchResults() {
    return ForEach(() => model.recipeSearchResults, x => {
        const inv = findInventoryItem(x.f);
        return <p>
			<div className='row'>
				<div mu:if={x.i.u} className='cell'><button title={`Go To ${x.g.n}.${x.i.n}.${x.f.n}`} className='goto' onclick={() => gotoFlavor(x.f)}>»</button></div>
				<div className='cell'>{x.g.n}.{x.i.n}.{x.f.n}</div>
				<div className='cell'>{renderGenerateButton(inv)}</div>
			</div>
			<ul className='componentList'>
				{ForEach(() => x.f.c, y => renderFlavorAmount(y, 2))}
			</ul>
		</p>;
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
        Object.values(model.generators).forEach(x => {
            if (!x.e) {
                return;
            }
            generate(x, x.a);
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
const app = (<>
		<div mu:if={!model.interval} className='loading'>{model.loadingStatus}</div>
		<div mu:if={model.gameClock > 2 * updateRate}>{model.gameClock}</div>
		<div mu:else>
			<h1>Quarks</h1>
			<div id='menu'>
				<button id={`tab_${Tabs.Generate}`} className='selected' onclick={() => setTab(Tabs.Generate)}>Generate</button>
				<button id={`tab_${Tabs.Discover}`} onclick={() => setTab(Tabs.Discover)}>Discover</button>
				<button id={`tab_${Tabs.Settings}`} onclick={() => setTab(Tabs.Settings)}>Settings</button>
				<button id={`tab_${Tabs.Help}`} onclick={() => setTab(Tabs.Help)}>Help</button>
			</div>
			<div mu:if={model.activeTab === Tabs.Generate} className='generate'>
				<p>This is the main place for generating resources</p>
				<div className='itemGroups'>
					{renderItemGroups()}
					<p mu:if={model.activeGroup.u}>{model.activeGroup?.info}</p>
				</div>
				<div className='items'>
					{renderItems()}
					<p mu:if={model.activeItem.u}>{model.activeItem?.info}</p>
				</div>
				<div className='flavors'>
					{renderFlavors()}
				</div>
				<div mu:if={model.activeFlavor.m >= 0} className='activeFlavor'>
					{Swapper(renderActiveFlavor)}
				</div>
			</div>
			<div mu:if={model.activeTab === Tabs.Discover} className='discover'>
				<p>This is the main place for discovering new resources.</p>

				Discover : unlock new items in the generate tab.
				
				<ul>
					<li>filter items? (text input, group/item select, quantity filter)</li>
					<li>add items to 'crafting table'?</li>
					<li>test create? (no penalty)</li>
				</ul>
				
				<div>
					<h3>Inventory</h3>
					<div>
					{ForEach(() => Object.values(model.inventory).sort((a, b) => a.f.n.localeCompare(b.f.n)), x => renderFlavorAmount(x, 1))}
					</div>
				</div>
				<div>
				</div>
			
			</div>
			<div mu:if={model.activeTab === Tabs.Settings} className='settings'>
				<p>This is where you can change game settings.</p>
				Settings
				<ul>
					<li>show/hide info</li>
					<li>save/load</li>
					<li>hard reset game</li>
					<li>infinite mode (all unlocked, infinite of g0-g3? items)</li>
					<li>auto search on flavor click</li>
					<li></li>
					<li></li>
				</ul>
			</div>
			<div mu:if={model.activeTab === Tabs.Help} className='help'>
				<p>This is where you can find information about the game.</p>
				Help
				<ul>
					<li>Buttons</li>
					<li>Generating</li>
					<li>Discovery</li>
					<li>about</li>
				</ul>
			</div>
			<br />
			<div className='mutraction'>
				Made with <a href='https://mutraction.dev/' target='_blank'>μtraction</a>
			</div>
		</div>
    </>);
document.body.append(app);
init();
