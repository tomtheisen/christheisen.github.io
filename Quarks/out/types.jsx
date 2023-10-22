export var MassUnits;
(function (MassUnits) {
    MassUnits["Da"] = "Da";
    MassUnits["ng"] = "ng";
    MassUnits["Kg"] = "Kg";
    MassUnits["Eg"] = "Eg";
    MassUnits["MO"] = "M\u2609";
})(MassUnits || (MassUnits = {}));
export const MassUnitInfo = {
    Da: { s: 'Da', n: 'Dalton', c: 602217364335000 },
    ng: { s: 'ng', n: 'Nanogram', c: 1000000000000 },
    Kg: { s: 'Kg', n: 'Kilogram', c: 1000000000000000 },
    Eg: { s: 'Eg', n: 'Exagram', c: 1378679941220000 },
    MO: { s: 'M☉', n: 'Solar Mass', c: Infinity }
};
export const FlavorMap = {}; //Flavor Name -> Item
export const ItemMap = {}; //Item Name => Item Group
export const ComponentMap = {}; //Component Flavor Name -> Flavor[]
export const defaultSettings = {
    i: true,
    s: false,
    h: false,
    c: -1
};
export const defaultItemGroup = {
    n: 'defaultGroup',
    u: false,
    info: 'default group',
    c: []
};
export const defaultItem = {
    n: 'defaultItem',
    u: false,
    g: -1,
    info: 'default item',
    c: []
};
export const defaultFlavor = {
    n: 'default flavor',
    m: -1,
    u: MassUnits.Da,
    c: []
};
export const defaultFlavorAmount = {
    f: defaultFlavor,
    a: -1
};
