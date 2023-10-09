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
    return <button className={`itemGroup ${!input.u ? 'hide' : ''}`} onclick={() => setGroup(input)}>{input.n}</button>;
}
function renderItemGroups() {
    return ForEach(model.data, x => renderItemGroup(x));
}
function renderItem(input) {
    return <button className={`item ${!input.u ? 'hide' : ''}`} onclick={() => setItem(input.i)}>{input.n}</button>;
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
    return <button className={`flavor ${!input.u ? 'hide' : ''}`} onclick={() => setFlavor(input.i)}>{input.n}</button>;
}
function renderFlavors() {
    return Swapper(() => ForEach(model.activeItem?.f, x => renderFlavor(x)));
}
function renderComponentItem(input) {
}
function renderInventoryItem(input) {
}
function renderGenerator(input) {
}
const app = (<>
        <h1>Quarks</h1>
		<div>
			<button onclick={() => setTab(0)}>Generate</button>
			<button onclick={() => setTab(1)}>Discover</button>
			<button onclick={() => setTab(2)}>Settings</button>
		</div>
		<div mu:if={model.activeTab === 0} className='generate'>
			<div className='itemGroups'>
				{renderItemGroups()}
			</div>
			<div className='items'>
				{renderItems()}
			</div>
			<div className='flavors'>
				{renderFlavors()}
			</div>
		</div>
		<div mu:if={model.activeTab === 1} className='discover'>
			Discover
		</div>
		<div mu:if={model.activeTab === 2} className='settings'>
			Settings
		</div>
    </>);
document.body.append(app);
