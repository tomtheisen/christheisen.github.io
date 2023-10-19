//Amount != mass; creating 1 unit give you 1 that weighs x; not gives you x units.
//Have to refigure a bunch.

enum MassUnits {Da='Da',ng='ng',Kg='Kg',Eg='Eg',MO='M☉'}

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


export const inventory : InventoryItem[] = [];
export const generators: Generator[] = [];

//flavors
const saQ_Up : Flavor = {n:'Up',m:.3,u:MassUnits.MO,c:[]};
const saQ_Down: Flavor = {n:'Down',m:.4,u:MassUnits.Da,c:[]};
const saL_Electron: Flavor = {n:'Electron',m:0,u:MassUnits.Da,c:[]};
const saB_Proton: Flavor = {n:'Proton',m:1,u:MassUnits.Da,c:[{f:saQ_Up,a:2},{f:saQ_Down,a:1}]};
const saB_Neutron: Flavor = {n:'Neutron',m:1,u:MassUnits.Da,c:[{f:saQ_Up,a:1},{f:saQ_Down,a:2}]};
const aH_Protium: Flavor = {n:'Protium',m:1,u:MassUnits.Da,c:[{f:saB_Proton,a:1},{f:saL_Electron,a:1}]};
const aH_Deuterium: Flavor = {n:'Deuterium',m:2,u:MassUnits.Da,c:[{f:saB_Proton,a:1},{f:saB_Neutron,a:1},{f:saL_Electron,a:1}]};
const aH_Tritium: Flavor = {n:'Tritium',m:3,u:MassUnits.Da,c:[{f:saB_Proton,a:1},{f:saB_Neutron,a:2},{f:saL_Electron,a:1}]};
const aHe_3 : Flavor = {n:'Helium-3',m:3,u:MassUnits.Da,c:[{f:saB_Proton,a:2},{f:saB_Neutron,a:1},{f:saL_Electron,a:2}]};
const aHe_4 : Flavor = {n:'Helium-4',m:4,u:MassUnits.Da,c:[{f:saB_Proton,a:2},{f:saB_Neutron,a:3},{f:saL_Electron,a:2}]};
const aLi_6 : Flavor = {n:'Lithium-6',m:6,u:MassUnits.Da,c:[{f:saB_Proton,a:3},{f:saB_Neutron,a:3},{f:saL_Electron,a:3}]};
const aLi_7 : Flavor = {n:'Lithium-7',m:7,u:MassUnits.Da,c:[{f:saB_Proton,a:3},{f:saB_Neutron,a:4},{f:saL_Electron,a:3}]};


//items
const sa_Quark : Item = {
	n:'Quark',u:true,g:1,
	info:'Quarks are some of the most basic building block. They come in 6 types: Up, Down, Charm, Strange, Top, and Bottom. In this game we are only using Up and Down.',
	c:[saQ_Up, saQ_Down]
};
const sa_Lepton : Item = {
	n:'Lepton',u:true,g:1,
	info:'Leptons are some of the most basic building block. They come in 6 types: Electron, Muon, Tau, Electron Neutrino, Muon Neutrino, and Tau Neutrino. In this game we are only using Electrons.',
	c:[saL_Electron]
};
const sa_Baryon : Item = {
	n:'Baryons',u:false,g:2,
	info:'Baryons are made of 3 Quarks. There are a few dozen different types of Baryons. In this game we are only using Protons and Neutrons.',
	c:[saB_Proton, saB_Neutron]
};
const a_H : Item ={
	n:'Hydrogen',u:false,g:3,
	info:'Hydrogen is the most common element in the universe, made with only a single proton. There are two stable isotopes and a third with a halflife of ~12 years.',
	c:[aH_Protium, aH_Deuterium, aH_Tritium]
};
const a_He : Item = {
	n:'Helium',u:false,g:3,
	info:'Helium has two stable isotopes. Helium-3 is much more rare than the normal Helium-4.',
	c:[aHe_3, aHe_4]
};
const a_Li : Item = {
	n:'Lithium', u:false, g:3,
	info:'Lithium has two stable isotopes. Lithium-6 is much more rare than the normal Lithium-7.',
	c:[aLi_6, aLi_7]
};

//groups
const sa : ItemGroup = {n:'Subatomic', u:true, c:[sa_Quark, sa_Lepton, sa_Baryon]};
const atomic : ItemGroup = {n:'Atomic', u: false, c:[a_H,a_He,a_Li]};

export const data:ItemGroup[] = 
[
	sa,
	atomic
];

export const FlavorMap: {[key: string]: Item} = {};//Flavor Name -> Item
export const ItemMap: {[key: string]: ItemGroup} = {};//Item Name => Item Group
export const ComponentMap: {[key: string]: Flavor[]} = {};//Component Flavor Name -> Flavor[]

data.forEach(g => {
	g.c.forEach(i => {
		if(ItemMap[i.n]){
			console.error('Item already exists: ' + i.n);
		}
		ItemMap[i.n] = g;
		
		i.c.forEach(f => {
			if(FlavorMap[f.n]){
				console.error('Flavor already exists: ' + f.n);
			}
			FlavorMap[f.n] = i;
			
			f.c.forEach(c => {
				if(!ComponentMap[c.f.n]){
					ComponentMap[c.f.n] = [] as Flavor[];
				}
			
				ComponentMap[c.f.n].push(f);
			})
		})
	})
});
