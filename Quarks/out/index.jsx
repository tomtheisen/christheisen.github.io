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
    return data.find(x => x.i === model.activeGroup)?.l
        .find(x => x.i === model.activeItem)?.f
        .find(x => x.i === model.activeFlavor);
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
    return <button className='itemGroup' onclick={() => setGroup(input.i)}>{input.n}</button>;
}
function renderItemGroups() {
    return ForEach(visibleGroups(), x => renderItemGroup(x));
}
function renderItem(input) {
    return <button className='item' onclick={() => setItem(input.i)}>{input.n}</button>;
}
function renderItems() {
    return ForEach(visibleItems(model.activeGroup), x => renderItem(x));
}
function renderFlavor(input) {
    return <button className='flavor' onclick={() => setFlavor(input.i)}>{input.n}</button>;
}
function renderFlavors() {
    return ForEach(visibleFlavors(model.activeGroup, model.activeItem), x => renderFlavor(x));
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
