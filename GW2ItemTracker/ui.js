const colTypes = {
	text:{build:addText},
	img:{build:addImg},
	link:{build:addLink}
};

const columns = {
	id:{id: 'id', type: colTypes.text, head: 'ID'},
	name:{id: 'name', type: colTypes.link, head: 'Name'},
	icon:{id: 'icon', type: colTypes.img, head: 'https://wiki.guildwars2.com/images/thumb/d/db/Guild_Wars_2_logo.svg/1200px-Guild_Wars_2_logo.svg.png'},
	buyTarget:{id: 'buyTarget', type: colTypes.text, head: 'Buy Target', 
		format: (row) => {return activeTab === 0 && row.sellPrice < row.buyTarget ? 'targetAchieved' : ''}},
	sellTarget:{id: 'sellTarget', type: colTypes.text, head: 'Sell Target', 
		format: (row) => {return activeTab === 0 && row.buyPrice > row.sellTarget ? 'targetAchieved' : ''}},
	buyPrice:{id: 'buyPrice', type: colTypes.text, head: 'Highest Buyer (G)', 
		format: (row) => {return activeTab === 0 && row.buyPrice > row.sellTarget ? 'targetAchieved' : ''}},
	sellPrice:{id: 'sellPrice', type: colTypes.text, head: 'Lowest Seller (G)', 
		format: (row) => {return activeTab === 0 && row.sellPrice < row.buyTarget ? 'targetAchieved' : ''}},
	sellQuantity:{id: 'sellQuantity', type: colTypes.text, head: 'Sells qty'},
	buyQuantity:{id: 'buyQuantity', type: colTypes.text, head: 'Buys qty'},
	vendorValue:{id: 'vendorValue', type: colTypes.text, head: 'Vendor Value (G)'},
	storage:{id: 'storage', type: colTypes.text, head: 'In Storage'},
	bank:{id: 'bank', type: colTypes.text, head: 'In Bank'},
	inventory:{id: 'inventory', type: colTypes.text, head: 'Inventory'},
	bag:{id: 'bag', type: colTypes.text, head: 'In Bags'},
	totalVendorValue:{id: 'totalVendorValue', type: colTypes.text, head: 'Total Vendor Value (G)'},
	totalTPValue:{id: 'totalTPValue', type: colTypes.text, head: 'Total TP Value (G)'}
}
const tabs = [
	{
		id: 'tabCostWatcher', 
		text: 'Price Watcher',
		data: getCostData,
		height: 90,
		columns: [
			columns.icon, 
			columns.name, 
			columns.id, 
			columns.buyPrice, 
			columns.sellTarget, 
			columns.sellPrice, 
			columns.buyTarget, 
			columns.storage
		]
	},
	{
		id: 'tabMaterialStorage',
		text: 'Material Value',
		data: getMaterialStorageData,
		height: 80,
		columns: [
			columns.icon, 
			columns.name, 
			columns.id, 
			columns.buyPrice, 
			columns.vendorValue,
			columns.storage,
			columns.totalTPValue,
			columns.totalVendorValue
		]
	},
	{
		id: 'tabBank',
		text: 'Bank Value',
		data: getBankData,
		height: 55,
		columns: [
			columns.icon, 
			columns.name, 
			columns.id, 
			columns.buyPrice, 
			columns.vendorValue,
			columns.bank,
			columns.totalTPValue,
			columns.totalVendorValue
		]
	},
	{
		id: 'tabSharedInventory',
		text: 'Inventory Value',
		data: getSharedInventory,
		height: 25,
		columns: [
			columns.icon, 
			columns.name, 
			columns.id, 
			columns.buyPrice, 
			columns.vendorValue,
			columns.inventory,
			columns.totalTPValue,
			columns.totalVendorValue
		]
	},
	{
		id: 'tabSharedInventory',
		text: 'Character Value',
		data: getBags,
		height: 60,
		columns: [
			columns.icon, 
			columns.name, 
			columns.id, 
			columns.buyPrice, 
			columns.vendorValue,
			columns.bag,
			columns.totalTPValue,
			columns.totalVendorValue
		]
	},
	{
		id: 'tabSettings',
		text: 'Settings',
		data: () => {},
		height: 55,
		columns: []
	}	
];
let activeTab = 0;
let sortCol = 'name';
let sortDir = 1;

const colHeaders = {
	id: 'ID',
	name: 'Name',
	icon: 'https://wiki.guildwars2.com/images/thumb/d/db/Guild_Wars_2_logo.svg/1200px-Guild_Wars_2_logo.svg.png',
	buyTarget: 'Buy Target',
	sellTarget: 'Sell Target',
	vendorValue: 'Vendor Value (G)',
	buyQuantity: 'Buys qty',
	buyPrice: 'Highest Buyer (G)',
	sellQuantity: 'Sells qty',
	sellPrice: 'Lowest Seller (G)',
	storage: 'In Storage',
	totalVendorValue: 'Total Vendor Value (G)',
	totalTPValue: 'Total TP Value (G)'
};

function sortTable(col){
	if(col === sortCol){sortDir *= -1;}
	else{sortCol = col; sortDir = 1;}
	
	if(sortCol === 'name'){
		itemPrices.sort((a,b) => a.name.localeCompare(b.name) * sortDir);
	}
	else{
		itemPrices.sort((a,b) => (a[sortCol] - b[sortCol]) * sortDir);
	}
	
	const outputDiv = document.getElementById('output');
	while(outputDiv?.firstChild){outputDiv.removeChild(outputDiv.firstChild);}
	buildHeadRow(outputDiv, colHeaders);
	itemPrices.forEach(x => buildItemPriceRow(outputDiv, x));
}

function addHead(parent, text, sort){
	const cell = document.createElement('div');
	cell.title = text;
	cell.className = 'headCell';
	cell.addEventListener('click', () => { sortTable(sort); });
	
	const temp = document.createTextNode(text);
	cell.appendChild(temp);
	
	parent.appendChild(cell);
}

function buildHeadRow(parent){
	if(!parent){return;}
	const div = document.createElement('div');
	div.classList.add('tableRow');
	div.classList.add('headRow');
	
	tabs[activeTab].columns.forEach(col => {
		if(col.type === colTypes.img){
			const img = document.createElement('img');
			img.src = col.head;
			img.alt = col.id;
			div.appendChild(img);
		}
		else{
			addHead(div, col.head, col.id);
		}
	});
	
	//spacer for button width
	const spacer = document.createElement('div');
	spacer.style.width = '66px';
	div.appendChild(spacer);
	parent.appendChild(div);
	
}

function addText(parent, text, className){
	const cell = document.createElement('div');
	cell.title = text;
	cell.className = 'tableCell';
	if(className){
		cell.classList.add(className);
	}
	
	const temp = document.createTextNode(text);
	cell.appendChild(temp);
	
	parent.appendChild(cell);
}

function addImg(parent, src, alt){
	const img = document.createElement('img');
	img.src = src;
	img.alt = alt;
	parent.appendChild(img);
	
	img.addEventListener('click', (event)=>{
		const id  = Number(event.target.alt);
		const item = itemPrices.find(x => x.id === id);
		
		document.getElementById('id').value = item.id;
		document.getElementById('buyTarget').value = item.buyTarget;
		document.getElementById('sellTarget').value = item.sellTarget;
	})
}

function addLink(parent, text){
	const cell = document.createElement('div');
	cell.title = text;
	cell.className = 'tableCell';
	
	const temp = document.createElement('a');
	temp.appendChild(document.createTextNode(text));
	temp.title = text;
	temp.href = `https://wiki.guildwars2.com/wiki/${text.replaceAll(' ', '_')}`
	temp.target = '_blank';
	
	cell.appendChild(temp);
	
	parent.appendChild(cell);
}

function buildItemPriceRow(parent, itemPrice){
	if(!parent){return;}
	const div = document.createElement('div');
	div.className = 'tableRow';
	
	const shouldBuy = activeTab === 0 && itemPrice.sellPrice < itemPrice.buyTarget;
	const shouldSell = activeTab === 0 && itemPrice.buyPrice > itemPrice.sellTarget;
	const maxStorage = activeTab === 0 && itemPrice.storage > 950;
	
	tabs[activeTab].columns.forEach(col => {
		const value = itemPrice[col.id];
		
		if(col.type === colTypes.img){
			col.type.build(div, value, itemPrice.id);
		}
		else{
			
			const className = col.format ? col.format(itemPrice) : '';
			col.type.build(div, value, className);
		}
	});
	if(activeTab === 0){
		const btn = document.createElement('button');
		btn.appendChild(document.createTextNode('X'));
		btn.addEventListener('click', () => removeItem(itemPrice.id));
		div.appendChild(btn);
	}
	
	parent.appendChild(div);
}

function buildTabs(){
	const parent = document.getElementById('tabSelector');
	
	tabs.forEach((tab, index)=> {
		const btn = document.createElement('button');
		btn.className = 'tabButton';
		btn.id = tab.id.replace('tab', 'btn');
		btn.addEventListener('click', () => setTab(btn, index));
		btn.appendChild(document.createTextNode(tab.text));
		
		if(index === activeTab){btn.classList.add('selectedTab');}
		
		parent.appendChild(btn);
	});
	
	
}

//UI Events:
function getApi(){
	const api = document.getElementById('api');
	if(api && api.value){
		localStorage.setItem(apiStorageKey, api.value);
		apiKey = api.value;
		return apiKey;
	}
	
	apiKey = localStorage.getItem(apiStorageKey);
	return apiKey;
}

function addItem(){
	const id = document.getElementById('id').value;
	const sellTarget = document.getElementById('sellTarget').value;
	const buyTarget = document.getElementById('buyTarget').value;
	addIdPrice(Number(id), Number(buyTarget), Number(sellTarget));
	
	document.getElementById('id').value = '';
	document.getElementById('sellTarget').value = '';
	document.getElementById('buyTarget').value = '';
	
	getData();
}

function setTab(sender, input){
	const selected = document.getElementsByClassName('selectedTab');
	Array.from(selected).forEach(x => x.classList.remove('selectedTab'));
	tabs.forEach(x => document.getElementById(x.id).classList.add('hidden'));

	sender.classList.add('selectedTab');
	activeTab = input;
	document.getElementById(tabs[activeTab].id)?.classList.remove('hidden');
	document.getElementById('input').style.height = `${tabs[activeTab].height}px`;
	document.getElementById('output').style.marginTop = `${tabs[activeTab].height+27}px`;
	
	getData();
}

function exportStorage(){
	var textToSave = JSON.stringify(IdPrices);
	var textToSaveAsBlob = new Blob([textToSave], {type: "text/plain"});
	var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
	
	var downloadLink = document.createElement("a");
	downloadLink.download = 'GW2TPT export.txt';
	downloadLink.innerHTML = "Download File";
	downloadLink.href = textToSaveAsURL;
	downloadLink.onclick = function () {
		document.body.removeChild(event.target);
	};
	downloadLink.style.display = "none";
	document.body.appendChild(downloadLink);
	downloadLink.click();
}

function importStorage(sender){	
	const file = sender.files[0];
	
	file.text().then((content) => {
		localStorage.setItem(storageKey, content);
		window.location.reload();
	});
}
