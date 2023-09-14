//Future functionality:
//https://wiki.guildwars2.com/wiki/API:2/account/recipes
//https://wiki.guildwars2.com/wiki/API:2/recipes

//cache result calls in session storage
	//add a clear cache button in settings.

const storageKey = 'GW2TPT_IP';
const apiStorageKey = 'GW2TPT_API';
const root='https://api.guildwars2.com/v2/';
const IdPrices = JSON.parse(localStorage.getItem(storageKey)) || [];
const itemPrices = [];
let materials = [];
let bank = [];
let inventory = [];
let characters = [];
let isLoading = false;
let apiKey = null;
let tokenInfo = null;

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
		case 0: {
			ownedMat = materials ? materials.find(x => x.id === item.id) : null;
			ownedBank = bank ? bank.find(x => x.id === item.id) : null;
			owned = ownedMat; 
		}
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
	const getItems = `${root}items?ids=${payload}`;
	const items = await (await fetch(getItems)).json() || [];
	return items;
}
async function getPrices(payload){
	const getPrices = `${root}commerce/prices?ids=${payload}`;
	const prices = await (await fetch(getPrices)).json() || [];
	return prices;
}

async function getCostData(){
	const ids = IdPrices.map(x => x.id).filter(x => x > 0);
	if(ids.length === 0){return;}
	
	const payload = ids.join(',');
	const items = await getItems(payload);
	const prices = await getPrices(payload);
	
	const authToken=getApi();
	const getStorage = `${root}account/materials?access_token=${authToken}`;
	
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

async function getMaterialStorageData(){
	const authToken=getApi();
	const getStorage = `${root}account/materials?access_token=${authToken}`;
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

async function getBankData(){
	const authToken=getApi();
	const getBank = `${root}account/bank?access_token=${authToken}`;
	if(!authToken){
		alert('No API token');
		return;
	}
	
	const filter = document.getElementById('bankFilter').value.toLowerCase();
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
		let tempItems = (await getItems(payload)).filter(x => x);
		if(filter){
			tempItems = tempItems.filter(x => 
				x.name.toLowerCase().includes(filter) || 
				x.type.toLowerCase().includes(filter) ||
				x.rarity.toLowerCase().includes(filter) ||
				(x.details?.type && x.details.type.toLowerCase().includes(filter))
				
			);
		}
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
		if(!item){return;}
		addItemPrice(item, price);
	});
}

async function getSharedInventory(){
	const authToken=getApi();
	const getStorage = `${root}account/inventory?access_token=${authToken}`;
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
	const authToken = getApi();
	const getChars = `${root}characters?ids=all&access_token=${authToken}`;
	const chars = await (await fetch(getChars)).json() || [];
	if(!Array.isArray(chars)){return;}
	characters = chars;
	
	const ddl = document.getElementById('ddlCharacters');
	characters.forEach((x, index) => {
		var opt = document.createElement('option');
		opt.value = index;
		opt.innerHTML = x.name;
		ddl.appendChild(opt);
	});
	
	getBags();
}

async function getBags(){
	document.getElementById('itemSearch').value = null;
	const outputDiv = document.getElementById('output');
	while(outputDiv?.firstChild){outputDiv.removeChild(outputDiv.firstChild);}
	
	const ddl = document.getElementById('ddlCharacters');
	const selectedChar = characters[ddl.value];
	const bags = selectedChar.bags;
	
	const payload = bags.filter(x => x).map(x => x.id).join(',');
	const bagData = (await getItems(payload));
	
	bags.forEach(async (bag, index) => {
		if(!bag?.id){return;} 
		
		const bagType = bagData.find(x => x.id === bag.id);
		const bagDiv = buildBagRow(outputDiv, `Bag ${index}`, bagType);
		bagDiv.id = `bag${ddl.value}_${index}`;
		bagDiv.className = 'bag';
		
		//get item data
		const bagItemsPayload = bag.inventory.filter(x => x).map(x => x.id).join(',');
		if(!bagItemsPayload){return;}
		const bagItems = (await getItems(bagItemsPayload));
		
		buildBag(bagDiv, bag.inventory, bagItems);
	});
}

async function searchBags(){
	const search = document.getElementById('itemSearch').value.toLowerCase();
	if(!search){return;}
	
	document.getElementById('ddlCharacters').value = null;
	
	//get list of all item name && id
	let itemIds = [];
	characters.forEach(c => {
		c.bags.forEach(b => {
			const tempIds = b?.inventory.filter(x => x).map(x => x.id);
			itemIds = itemIds.concat(tempIds);
		});
	});
	itemIds = [...new Set(itemIds)];
	const itemPayloads = chunkJoin(itemIds);
	
	//get ids for items that match
	let items = [];
	for(const payload of itemPayloads){
		let tempItems = (await getItems(payload));
		tempItems = tempItems.filter(x => 
			x.name.toLowerCase().includes(search) || 
			x.type.toLowerCase().includes(search) ||
			x.rarity.toLowerCase().includes(search) ||
		(x.details?.type && x.details.type.toLowerCase().includes(search)));
		
		tempItems = tempItems.map(x => 
		({id:x.id, name: x.name, type: x.type, icon: x.icon}));
		
		items = items.concat(tempItems);
	}
	
	const matchIds = items.map(x => x.id);
	const hits = [];
	//search bags for ids
	characters.forEach(c => {
		c.bags.forEach(b => {
			const tempHits = b?.inventory.filter(x => x && matchIds.includes(x.id));
			if(!tempHits){return;}
			
			tempHits.forEach(h => {
				const item = items.find(x => x.id === h.id);
				hits.push({character: c, bag: b, item: item, count: h.count});
			});
			
		});
	});
	
	const outputDiv = document.getElementById('output');
	while(outputDiv?.firstChild){outputDiv.removeChild(outputDiv.firstChild);}
	
	buildSearchResults(outputDiv, hits);
}

async function getWallet(){
	const authToken = getApi();
	const get = `${root}account/wallet?access_token=${authToken}`;
	const wallet = await (await fetch(get)).json() || [];
	const currencies = await (await fetch(`${root}currencies?ids=all`)).json() || [];

	console.log(wallet, currencies);
	wallet.forEach(x => {
		const currency = currencies.find(c => x.id === c.id);
		itemPrices.push({...x, ...currency});
	});
}

async function getTokenInfo(){
	const authToken = getApi();
	const get = `${root}tokeninfo?access_token=${authToken}`;

	tokenInfo = await (await fetch(get)).json() || {};
}

function populateData(){
	const outputDiv = document.getElementById('output');
	while(outputDiv?.firstChild){outputDiv.removeChild(outputDiv.firstChild);}
	
	itemPrices.sort((a,b) => a.name.localeCompare(b.name));
	buildHeadRow(outputDiv);
	itemPrices.forEach(x => buildItemPriceRow(outputDiv, x, false));
	
	if(activeTab === 7){buildTokenInfo(outputDiv, tokenInfo);}
}

async function getData(){
	isLoading = true;
	document.getElementById('loading').classList.remove('hidden');
	itemPrices.length = 0;
	populateData();
	sortCol = 'name';
	sortDir = 1;
	
	await tabs[activeTab].data();
	
	populateData();
	document.getElementById('loading').classList.add('hidden');
	isLoading = false;
}
