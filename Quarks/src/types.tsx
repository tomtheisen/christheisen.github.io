export enum MassUnits {Da='Da',ng='ng',Kg='Kg',Eg='Eg',MO='M☉'}

export interface MassUnit {
	i: number,//index
	k: string,//key
	s: string,//symbol
	n: string,//name
	c: number,//convertion ratio (cm.c = 100 to convert to m); 
	//while(dist.a[cm] -= massUnit.cm.c > massUnit.cm.c){dist.a[m]++;}
}
export const MassUnitInfo = {
	Da:{s:'Da',n:'Dalton',c:602217364335000},
	ng:{s:'ng',n:'Nanogram',c:1000000000000},
	Kg:{s:'Kg',n:'Kilogram',c:1000000000000000},
	Eg:{s:'Eg',n:'Exagram',c:1378679941220000},
	MO:{s:'M☉',n:'Solar Mass',c:Infinity}
}

export interface ItemGroup {
	n: string,//name
	u: boolean,//unlocked
	info: string,//some real world/game info
	c: Item[]//child items
}

export interface Item {
	n: string,//name
	u: boolean,//unlocked
	g: number,//base generator cost
	info: string,//some real world/game info
	c: Flavor[]//children; isotopes etc...
}

export interface Flavor {
	n: string,//name
	m: number,//mass
	u: MassUnits,//MassUnits
	c: ComponentItem[]//Components needed to create
}

export interface ComponentItem {
	f: Flavor,
	a: number,//amount
}

export interface InventoryItem {
	f: Flavor
	a: number,//amount
}

export interface Generator {
	f: Flavor,
	l: number,//level
	a: boolean//active
}

export interface RecipeSearchResults {
	g: ItemGroup,
	i: Item,
	f: Flavor
}

export const FlavorMap: {[key: string]: Item} = {};//Flavor Name -> Item
export const ItemMap: {[key: string]: ItemGroup} = {};//Item Name => Item Group
export const ComponentMap: {[key: string]: Flavor[]} = {};//Component Flavor Name -> Flavor[]

