//manage all auto-generators somewhere?
	//Or just show the input/output of an item?

//display gameclock if > updateRate

//update stuff isn't quite doing
	//generate button
	//visible groups
	//generator

//save/load
	//save/load object
	//inventory {f.name, amount}
	//generators {f.name, level, enabled}
	//unlocked groups/items
	//time
	
//Discovery?
	//figure out how this is going to work
	//item builder/suggestion?
	
//settings
	//settings object in model
//help

//hotkeys
//1234...
//qwerty...
//asffg...
//zxvbm...

enum Tabs {Generate, Discover, Settings, Help};
const tabButtons : { [key: string]: HTMLElement } = {};
let menu = document.getElementById('menu');

const saveRate = 10;//updates per save
const tickRate = 100;//ms
const updateRate = 1000;//ms

import { data, buildMaps, load, save } from "./data.js";
import {
	ItemGroup, Item, Flavor, ComponentItem, InventoryItem, Generator, 
	RecipeSearchResults, ItemMap, FlavorMap, ComponentMap 
} from "./types.js";
import { track, ForEach, effect, Swapper } from "mutraction-dom";

let activeTab=0;
const model = track({ 
	data: data,
	activeTab: 0, 
	activeGroup: undefined as ItemGroup | undefined, 
	activeItem: undefined as Item | undefined,
	activeFlavor: undefined as Flavor | undefined,
	activeInventoryItem: undefined as InventoryItem | undefined,
	inventory: [] as InventoryItem[], 
	generators: [] as Generator[],
	recipeSearchResults: [] as RecipeSearchResults[],
	loadingStatus: 'Loading',
	interval: 0,
	gameClock: 0,
	lastUpdate: 0,
	lastSave: 0
});


function generatorCost(input: Generator){
	const item : Item = FlavorMap[input.f.n];
	return (10**item.g)**input.l;
}

function findInventoryItem(input: Flavor) : InventoryItem {
	const temp = model.inventory.find(x => x.f === input);
	if(temp){return temp;}
	
	const newInvItem : InventoryItem = { f: input, a: 0 };
	model.inventory.push(newInvItem);
	return findInventoryItem(input);
}

function findGenerator(input: Flavor) : Generator{
	const temp = model.generators.find(x => x.f === input);
	if(temp){return temp;}
	
	const newGenerator : Generator = { f: input, l: 0, a: true };
	model.generators.push(newGenerator);
	return newGenerator;
}

function recipeSearch(input: Flavor){
	model.recipeSearchResults.length = 0;
	
	const c = ComponentMap[input.n];

	c.forEach(f => {
		const i = FlavorMap[f.n];
		const g = ItemMap[i.n];
		
		model.recipeSearchResults.push({ g: g, i: i, f: f});
	});
}

function hasComponents(input: Flavor):boolean{
	let output = true;
	
	input.c.forEach(c => {
		const inv = findInventoryItem(c.f);
		if(inv.a < c.a){output = false;}
	});

	return output;
}

function generate(input: InventoryItem){
	//find generator
	const gen = findGenerator(input.f);
	if(!gen){return;}
	
	if(!hasComponents(input.f)){return;}
	
	const i = FlavorMap[input.f.n];
	i.u = true;
	ItemMap[i.n].u = true;
	
	input.f.c.forEach(c => {
		const inv = findInventoryItem(c.f);
		inv.a -= c.a;
	});

	input.a++;
	return;
}

function upgradeGenrator(input: Flavor){
	const gen = findGenerator(input);
	const inv = findInventoryItem(input);
	const cost = generatorCost(gen);
	
	if(inv.a < cost){ return; }
	
	gen.l++;
	inv.a -= cost;
}

function setTab(input: number){
	Object.values(tabButtons).forEach(x => x.classList.remove('selected'));
	tabButtons[`tab_${input}`].classList.add('selected');
	
	model.activeTab = input;
	model.activeGroup = undefined;
	model.activeItem = undefined;
	model.activeFlavor = undefined;
	model.recipeSearchResults.length = 0;
}

function setGroup(input: ItemGroup){
	model.activeGroup = input;
	model.activeItem = undefined;
	model.activeFlavor = undefined;
	model.recipeSearchResults.length = 0;
}

function setItem(input: Item){
	model.activeItem = input;
	model.activeFlavor = undefined;
	model.recipeSearchResults.length = 0;
}

function setFlavor(input: Flavor){
	model.activeFlavor = input;
	model.recipeSearchResults.length = 0;

	model.activeInventoryItem = findInventoryItem(model.activeFlavor);
}

function gotoFlavor(input: Flavor){
	const i = FlavorMap[input.n];
	const g = ItemMap[i.n];
	
	setTab(Tabs.Generate);
	setGroup(g);
	setItem(i);
	setFlavor(input);
}

function gotoItem(input: Item){
	const g = ItemMap[input.n];
	
	setTab(Tabs.Generate);
	setGroup(g);
	setItem(input);
}


function renderItemGroups(){
	return ForEach(model.data, x => 
		<button className={`itemGroup${!x.u ? ' hide' : ''}${x===model.activeGroup? ' selected': ''}`} onclick={()=>setGroup(x)}>{x.n}</button>
	);
}

function renderItems(){
	return ForEach(() => model.activeGroup?.c ?? [], x => 
		<button className={`item${!x.u ? ' hide' : ''}${x===model.activeItem? ' selected': ''}`} onclick={()=>setItem(x)}>{x.n}</button>
		);
		
}

function renderFlavors(){
	return ForEach(() => model.activeItem?.c ?? [], x => 
		<button className={`flavor${!x.u ? ' hide' : ''}${x===model.activeFlavor? ' selected': ''}`} onclick={()=>setFlavor(x)}>{x.n}</button>
		);
}

function renderGenerateButton(input: InventoryItem){
	const i = FlavorMap[input.f.n];
	const canDo = hasComponents(input.f);
	const className = `generateButton${!canDo?' disabled':''}`;
	return <button className={className} onclick={()=>generate(input)}>Generate</button>
}

function renderActiveFlavor(){
	return Swapper(() => renderFlavor(model.activeFlavor as Flavor));
}
function renderFlavor(input: Flavor){
	const inv = findInventoryItem(input);
	const i = FlavorMap[input.n];
	const g = ItemMap[i.n];
	
	return <>
		<div className='row'>
			<div className='cell block'>
				<div className='title'>Inventory</div>
				<div style={{display: 'flex'}}>
					<div>
						{renderGenerateButton(inv)}
						<div className='ownedItem'>Owned: {inv?.a ?? 0}</div>
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
					<div>{
						model.activeFlavor?.c?.length ? 
							ForEach(() => model.activeFlavor?.c ?? [], x => renderComponentItem(x)) :
							<span>This is an elementary particle, it does not have components.</span>
					}
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
	</>
}

function renderComponentItem(input: ComponentItem){
	const inv = findInventoryItem(input.f);

	const i : Item = FlavorMap[input.f.n];
	const g : ItemGroup = ItemMap[i.n];
	if(!g || !i){
		return <li>component not found</li>;
	}
	
	return <div className='row'>
				<div className='cell'>{g.n}.{i.n}.{input.f.n}</div>
				<div className='cell'><button onclick={() => gotoFlavor(input.f)}>→</button></div>
				<div className='cell'> Owned:{inv.a} / Need:{input.a}</div>
				<div className='cell'>{renderGenerateButton(inv)}</div>
			</div>
}

function renderInventoryItem(input: InventoryItem){
	const inv = findInventoryItem(input.f);

	return <div className='row'>
		<div className='cell'>
			{input.f.n}
		</div>
		<div className='cell'>
			{inv?.a ??0}
		</div>
	</div>
}

function renderGenerator(input: Flavor){
	if(!input){return <div className='hide'></div>}
	
	const gen = findGenerator(input);
	if(!gen){return <div className='generator'>Empty</div>;}
	
	return <div>
		<div className='generator'>
			<div>
				<button onclick={() => upgradeGenrator(input)}>Upgrade<br/>({generatorCost(gen)})</button>
			</div>
			<div>
				<div className='nowrap'>
					<label htmlFor={`chkGen${input.n}`}>Enabled:</label>
					<input id={`chkGen${input.n}`} type='checkbox' checked={gen.a} onchange={() => gen.a = !gen.a} />
				</div>
				<div className='nowrap'>Level: {gen.l}</div>
			</div>
		</div>
		<div>
			This will generate up to {gen.l} items every tick.
		</div>
	</div>
}

function renderSearchResults(){
	return ForEach(() => model.recipeSearchResults, x => {
		const inv = findInventoryItem(x.f);

		return <p>
			<div className='row'>
				<div className='cell'>{x.g.n}.{x.i.n}.{x.f.n}</div>
				<div mu:if={x.i.u} className='cell'><button onclick={() => gotoItem(x.i)}>→</button></div>
				<div className='cell'>{renderGenerateButton(inv)}</div>
			</div>
			<ul className='componentList'>
				{ForEach(() => x.f.c, y => renderComponentItem(y))}
			</ul>
		</p>
	});
}

function mainLoop(){
	const now = performance.now();
	model.gameClock += now-model.lastUpdate;
	model.lastUpdate = now;
	
	//avoid getting stuck if some other need to happen
	let maxCycles = 100;
	while(model.gameClock > updateRate && maxCycles--){
		model.gameClock -= updateRate;

		//do generates
		model.generators.forEach(x => {
			if(!x.a){return;}
			
			const inv = findInventoryItem(x.f);
			for(let i=0;i< x.l;i++){
				generate(inv);
			}
		});
		
		//sometimes save
		if(--model.lastSave<=0){
			save();
			model.lastSave = saveRate;
		}
	}
}

function init(){
	model.loadingStatus = 'Loading Game Data';
	buildMaps();
	
	model.loadingStatus = 'Loading Save Data';
	load();

	model.loadingStatus = 'Starting Game';
	model.lastUpdate = performance.now();
	model.interval = setInterval(mainLoop, tickRate);
	
	menu = document.getElementById('menu');
	for(const tab in Tabs){
		const t = `tab_${tab}`;
		const e = document.getElementById(t);
		if(!e){continue;}
		tabButtons[t] = e;
	}
}

const app = (
    <>
		<div mu:if={!model.interval} className='loading'>{model.loadingStatus}</div>
		<div mu:else>
			<h1>Quarks</h1>
			<div id='menu'>
				<button id={`tab_${Tabs.Generate}`} className='selected' onclick={()=>setTab(Tabs.Generate)}>Generate</button>
				<button id={`tab_${Tabs.Discover}`} onclick={()=>setTab(Tabs.Discover)}>Discover</button>
				<button id={`tab_${Tabs.Settings}`} onclick={()=>setTab(Tabs.Settings)}>Settings</button>
				<button id={`tab_${Tabs.Help}`} onclick={()=>setTab(Tabs.Help)}>Help</button>
			</div>
			<div mu:if={model.activeTab===Tabs.Generate} className='generate'>
				<div className='itemGroups'>
					{ renderItemGroups() }
					<p mu:if={!!model.activeGroup}>{model.activeGroup?.info}</p>
				</div>
				<div className='items'>
					{ renderItems() }
					<p mu:if={!!model.activeItem}>{model.activeItem?.info}</p>
				</div>
				<div className='flavors'>
					{ renderFlavors() }
				</div>
				<div mu:if={!!model.activeFlavor} className='activeFlavor'>
					{  renderActiveFlavor() }
				</div>
			</div>
			<div mu:if={model.activeTab===Tabs.Discover} className='discover'>
				Discover : unlock new items in the generate tab.
				
				<ul>
					<li>filter items?</li>
					<li>add items to 'crafting table'?</li>
					<li>test create? (no penalty)</li>
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
			<div mu:if={model.activeTab===Tabs.Settings} className='settings'>
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
			<div mu:if={model.activeTab===Tabs.Help} className='help'>
				Help
				<ul>
					<li>Buttons</li>
					<li>Generating</li>
					<li>Discovery</li>
					<li>about</li>
				</ul>
			</div>
			<br/>
			<div className='mutraction'>
				Made with <a href='https://mutraction.dev/' target='_blank'>μtraction</a>
			</div>
		</div>
    </>
)

document.body.append(app);

init();
