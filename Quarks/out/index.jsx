//TODO: manage all auto-generators somewhere?
//TODO: item builder/suggestioner in Discovery
//update generate button
//Buy generator
//tick - 100 / every 1000 do an update
//save/load
//Discovery?
var Tabs;
(function (Tabs) {
    Tabs[Tabs["Generate"] = 0] = "Generate";
    Tabs[Tabs["Discover"] = 1] = "Discover";
    Tabs[Tabs["Settings"] = 2] = "Settings";
})(Tabs || (Tabs = {}));
;
import { data, ItemMap, FlavorMap, ComponentMap } from "./data.js";
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
    recipeSearchResults: []
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
    const newInvItem = { f: input, a: 0 };
    model.inventory.push(newInvItem);
    return findInventoryItem(input);
}
function findGenerator(input) {
    const temp = model.generators.find(x => x.f === input);
    if (temp) {
        return temp;
    }
    const newGenerator = { f: input, l: 0, a: false };
    model.generators.push(newGenerator);
    return newGenerator;
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
        }
    });
    return output;
}
function generate(input) {
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
    input.a += gen.l + 1;
    return;
}
function setTab(input) {
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
    return <button className={className} onclick={() => generate(input)}>Generate</button>;
}
function renderActiveFlavor() {
    console.log({ ...model.activeFlavor });
    return Swapper(() => renderFlavor(model.activeFlavor));
}
function renderFlavor(input) {
    const inv = findInventoryItem(input);
    const i = FlavorMap[input.n];
    const g = ItemMap[i.n];
    return <div className='flavor'>
		<hr />
		<h4>Inventory</h4>
		<div style={{ display: 'flex' }}>
			<div>
				{renderGenerateButton(inv)}
				<div className='ownedItem'>Owned: {inv?.a ?? 0}</div>
			</div>
			<div>
				Picture?
			</div>
		</div>
		<hr />
		<h4>Generator</h4>
		{renderGenerator(input)}
		<hr />
		<h4>Components</h4>
		<div>
			<div>{model.activeFlavor?.c?.length ?
            ForEach(() => model.activeFlavor?.c ?? [], x => renderComponentItem(x)) :
            <span>This is an elementary particle, it does not have components.</span>}
			</div>
		</div>
		<hr />
		<h4>Used in</h4>
		<div mu:if={!model.recipeSearchResults.length}>
			<button onclick={() => recipeSearch(input)}>
				Search
			</button>
			<p>
				Spoiler Alert: This will show all items this item is a component for; including ones you have not unlocked yet.
				If you want to find everything the hard way then don't click.
			</p>
		</div>
		<div mu:if={!!model.recipeSearchResults.length}>
			{Swapper(() => renderSearchResults())}
		</div>
	</div>;
}
function renderComponentItem(input) {
    const inv = findInventoryItem(input.f);
    const i = FlavorMap[input.f.n];
    const g = ItemMap[i.n];
    if (!g || !i) {
        return <li>component not found</li>;
    }
    return <div className='row'>
				<div className='cell'>{g.n}.{i.n}.{input.f.n}</div>
				<div className='cell'> Owned:{inv.a} / Need:{input.a}</div>
				<div className='cell'>{renderGenerateButton(inv)}</div>
			</div>;
}
function renderInventoryItem(input) {
    const inv = findInventoryItem(input.f);
    return <div className='inventoryItem'>
		{input.f.n}
		Owned: {inv?.a ?? 0}
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
				<button>Upgrade<br />({generatorCost(gen)})</button>
			</div>
			<div>
				<div className='nowrap'>
					<label htmlFor={`chkGen${input.n}`}>Enabled:</label>
					<input id={`chkGen${input.n}`} type='checkbox' checked={gen.a}/>
				</div>
				<div className='nowrap'>Level: {gen.l}</div>
			</div>
		</div>
		<div>
			This will generate up to {gen.l} items every tick.
		</div>
	</div>;
}
function renderSearchResults() {
    return ForEach(() => model.recipeSearchResults, x => {
        const inv = findInventoryItem(x.f);
        return <p>
			<div className='row'>
				<div className='cell'>{x.g.n}.{x.i.n}.{x.f.n}</div>
				<div className='cell'>{renderGenerateButton(inv)}</div>
			</div>
			<ul className='componentList'>
				{ForEach(() => x.f.c, y => renderComponentItem(y))}
			</ul>
		</p>;
    });
}
const app = (<>
        <h1>Quarks</h1>
		<div>
			<button onclick={() => setTab(Tabs.Generate)}>Generate</button>
			<button onclick={() => setTab(Tabs.Discover)}>Discover</button>
			<button onclick={() => setTab(Tabs.Settings)}>Settings</button>
		</div>
		<div mu:if={model.activeTab === Tabs.Generate} className='generate'>
			<div className='itemGroups'>
				{renderItemGroups()}
			</div>
			<div className='items'>
				{renderItems()}
				<p mu:if={!!model.activeItem}>{model.activeItem?.info}</p>
			</div>
			<div className='flavors'>
				{renderFlavors()}
			</div>
			<div mu:if={!!model.activeFlavor} className='activeFlavor'>
				{renderActiveFlavor()}
			</div>
		</div>
		<div mu:if={model.activeTab === Tabs.Discover} className='discover'>
			Discover : unlock new items in the generate tab.
			
			<ul>
				<li>list inventory</li>
				<li>filters?</li>
				<li>add items?</li>
			</ul>
			
			<div>
				<h3>Inventory</h3>
				<div>
				{ForEach(model.inventory, x => renderInventoryItem(x))}
				</div>
			</div>
			<div>
			</div>
		
		</div>
		<div mu:if={model.activeTab === Tabs.Settings} className='settings'>
			Settings
			<ul>
				<li>show/hide info</li>
				<li>save/load</li>
				<li>hard reset game</li>
				<li>infinite mode (all unlocked, infinite of g0-g3? items)</li>
				<li>auto search on flavor click</li>
				<li></li>
				<li></li>
				<li>about</li>
			</ul>
		</div>
		<br />
		<div className='mutraction'>
			Made with <a href='https://mutraction.dev/' target='_blank'>μtraction</a>
		</div>
    </>);
document.body.append(app);
