//Future functionality:
//https://wiki.guildwars2.com/wiki/API:2/account/inventory
//https://wiki.guildwars2.com/wiki/API:2/v2/characters?ids=all
//https://wiki.guildwars2.com/wiki/API:2/characters/:id/inventory
//https://wiki.guildwars2.com/wiki/API:2/account/recipes
//https://wiki.guildwars2.com/wiki/API:2/account/wallet
//https://wiki.guildwars2.com/wiki/API:2/recipes
//https://wiki.guildwars2.com/wiki/API:2/tokeninfo

//Loading thing.

const storageKey = 'GW2TPT_IP';
const apiStorageKey = 'GW2TPT_API';
const IdPrices = JSON.parse(localStorage.getItem(storageKey)) || [];
const itemPrices = [];
let materials = [];
let bank = [];
let inventory = [];
let apiKey = null;

//data management
function addIdPrice(id, buyTarget, sellTarget){
	id = Number(id);
	buyTarget = Number(buyTarget);
	sellTarget = Number(sellTarget);
	if(IdPrices.some(x => x.id === id)){
		if(confirm('Item already exists in list. Update price?')){
			IdPrices.find(x => x.id === id).buyTarget = buyTarget;
			IdPrices.find(x => x.id === id).sellTarget = sellTarget;
			localStorage.setItem(storageKey, JSON.stringify(IdPrices));
		}
		return;
	}
	
	IdPrices.push({id: id, buyTarget: buyTarget, sellTarget: sellTarget});
	localStorage.setItem(storageKey, JSON.stringify(IdPrices));
}

function removeItem(id){
	const index = IdPrices.map(x => x.id).indexOf(id);
	if(index < 0){return;}
	IdPrices.splice(index,1);
	localStorage.setItem(storageKey, JSON.stringify(IdPrices));
	getData();
}

function addItemPrice(item, price, buyTarget, sellTarget){
	
	if(!price?.id){
		if(activeTab === 1 && document.getElementById('chkHideNoPriceStorage').checked){return;}
		if(activeTab === 2 && document.getElementById('chkHideNoPriceBank').checked){return;}
		price = {
			buys:{quantity:0, unit_price:0},
			sells:{quantity:0, unit_price:0}
		}
	};
	
	let ownedMat = null;
	let ownedBank = null;
	let ownedInventory = null;
	let owned = 0;
	switch(activeTab){
		case 1: {
			ownedMat = materials ? materials.find(x => x.id === item.id) : null;
			owned = ownedMat; 
			break;
		}
		case 2: {
			ownedBank = bank ? bank.find(x => x.id === item.id) : null;
			owned = ownedBank; 
			break;
		}
		case 3:{
			ownedInventory = inventory ? inventory.find(x => x.id === item.id) : null;
			owned = ownedInventory; 
			break;
		}
	}
	
	itemPrices.push({
		id: item.id,
		name: item.name,
		icon: item.icon,
		buyTarget: buyTarget,
		sellTarget: sellTarget,
		vendorValue: item.vendor_value/10000,
		buyQuantity: price.buys.quantity,
		buyPrice: price.buys.unit_price/10000,
		sellQuantity: price.sells.quantity,
		sellPrice: price.sells.unit_price/10000,
		storage: ownedMat?.count || 0,
		bank: ownedBank?.count || 0,
		inventory: ownedInventory?.count || 0,
		totalVendorValue: item.vendor_value * owned?.count / 10000,
		totalTPValue: price.buys.unit_price * owned?.count / 10000
	});
}

function chunkJoin(input, chunkSize=200){
	const output = [];
	for(let i=0;i<input.length;i+=chunkSize){
		output.push(input.slice(i, i+chunkSize).join(','));
	}
	return output;
}

//Call API
async function getItems(payload){
	const getItems = `https://api.guildwars2.com/v2/items?ids=${payload}`;
	const items = await (await fetch(getItems)).json() || [];
	return items;
}
async function getPrices(payload){
	const getPrices = `https://api.guildwars2.com/v2/commerce/prices?ids=${payload}`;
	const prices = await (await fetch(getPrices)).json() || [];
	return prices;
}

async function getCostData(outputDiv){
	const ids = IdPrices.map(x => x.id).filter(x => x > 0);
	if(ids.length === 0){return;}
	
	const payload = ids.join(',');
	const items = await getItems(payload);
	const prices = await getPrices(payload);
	
	const authToken=getApi();
	const getStorage = `https://api.guildwars2.com/v2/account/materials?v=2021-07-24T00%3A00%3A00Z&access_token=${authToken}`;
	
	if(!!authToken){
		const tempMaterials = await (await fetch(getStorage)).json() || [];
		materials = Array.isArray(tempMaterials) ? tempMaterials : [];
	}
	
	IdPrices.forEach(temp => {
		const item = items.find(x => x.id === temp.id);
		const price = prices.find(x => x.id === temp.id);
		addItemPrice(item, price, temp.buyTarget || 0, temp.sellTarget || 0);
	})
}

async function getMaterialStorageData(outputDiv){
	const authToken=getApi();
	const getStorage = `https://api.guildwars2.com/v2/account/materials?v=2021-07-24T00%3A00%3A00Z&access_token=${authToken}`;
	if(!authToken){
		alert('No API token');
		return;
	}
	
	materials = [];
	const tempMaterials = await (await fetch(getStorage)).json() || [];
	if(!Array.isArray(tempMaterials)){return;}
	
	if(tempMaterials.length < 1){return;}
	
	const limit = Number(document.getElementById('materialThreshold').value);
	materials = tempMaterials.filter(x => x.count >= limit);
	if(materials.length < 1){return;}

	const itemIds = materials.map(x => x.id);
	const itemPayloads = chunkJoin(itemIds);
	let items = [];
	for(const payload of itemPayloads){
		const tempItems = await getItems(payload);
		items = items.concat(tempItems);
	}
	
	const priceIds = materials.filter(x => !x.binding).map(x => x.id);
	const pricePayloads = chunkJoin(priceIds);
	let prices = [];
	for(const payload of pricePayloads){
		const tempPrices = await getPrices(payload);
		prices = prices.concat(tempPrices);
	}
	
	materials.forEach(temp => {
		const item = items.find(x => x.id === temp.id);
		const price = prices.find(x => x.id === temp.id);
		addItemPrice(item, price);
	});
}

async function getBankData(outputDiv){
	const authToken=getApi();
	const getBank = `https://api.guildwars2.com/v2/account/bank?v=2021-07-24T00%3A00%3A00Z&access_token=${authToken}`;
	if(!authToken){
		alert('No API token');
		return;
	}
	
	const tempBank = await (await fetch(getBank)).json() || [];
	
	if(!Array.isArray(tempBank)){return;}
	bank = [];
	tempBank.filter(x => x).forEach(x => {
		const item = bank.find(y => y.id === x.id);
		if(item){ item.count += x.count; }
		else{ bank.push(x); }
	});
	
	const itemIds = bank.map(x => x.id);
	const itemPayloads = chunkJoin(itemIds);
	let items = [];
	for(const payload of itemPayloads){
		const tempItems = await getItems(payload);
		items = items.concat(tempItems);
	}
	
	const priceIds = bank.filter(x => !x.binding).map(x => x.id);
	const pricePayloads = chunkJoin(priceIds);
	let prices = [];
	for(const payload of pricePayloads){
		const tempPrices = await getPrices(payload);
		prices = prices.concat(tempPrices);
	}
	
	bank.forEach(temp => {
		const item = items.find(x => x.id === temp.id);
		const price = prices.find(x => x.id === temp.id);
		addItemPrice(item, price);
	});
}

async function getSharedInventory(outputDiv){
	const authToken=getApi();
	const getStorage = `https://api.guildwars2.com/v2/account/inventory?v=2021-07-24T00%3A00%3A00Z&access_token=${authToken}`;
	if(!authToken){
		alert('No API token');
		return;
	}

	const tempInventory = await (await fetch(getStorage)).json() || [];
	if(!Array.isArray(tempInventory)){return;}
	inventory = tempInventory.filter(x => x).filter(x => x.id !== 78599);//filter out level 80 boost, it breaks things.

	const itemPayload = inventory.map(x => x.id).join(',');
	const pricesPayload = inventory.filter(x => !x.binding).map(x => x.id).join(',');
	const items = itemPayload ? await getItems(itemPayload) : [];
	const prices = pricesPayload ? await getPrices(pricesPayload) : [];

	inventory.forEach(temp => {
		const item = items.find(x => x.id === temp.id);
		const price = prices.find(x => x.id === temp.id);
		addItemPrice(item, price);
	})
}

async function getCharacters(){
	//make dropdown with characters for inventory
}

async function getBags(outputDiv){
	
}

async function getData(){
	const outputDiv = document.getElementById('output');
	while(outputDiv?.firstChild){outputDiv.removeChild(outputDiv.firstChild);}
	itemPrices.length = 0;
	sortCol = 'name';
	sortDir = 1;
	
	await tabs[activeTab].data(outputDiv);
	
	itemPrices.sort((a,b) => a.name.localeCompare(b.name));
	buildHeadRow(outputDiv, colHeaders, true);
	itemPrices.forEach(x => buildItemPriceRow(outputDiv, x, false));
}
