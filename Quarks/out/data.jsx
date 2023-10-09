var MassUnits;
(function (MassUnits) {
    MassUnits["Da"] = "Da";
    MassUnits["ng"] = "ng";
    MassUnits["Kg"] = "Kg";
    MassUnits["Eg"] = "Eg";
    MassUnits["MO"] = "M\u2609";
})(MassUnits || (MassUnits = {}));
export const inventory = [{ g: 0, i: 0, f: 0, a: 0 }];
export const generators = [];
export function visibleGroups() {
    return data.filter(x => x.u);
}
export function visibleItems(groupId) {
    const group = visibleGroups().find(x => x.i === groupId);
    if (!group) {
        return [];
    }
    return group.l.filter(x => x.u);
}
export function visibleFlavors(groupId, itemId) {
    const item = visibleItems(groupId).find(x => x.i === itemId);
    if (!item) {
        return [];
    }
    return item.f;
}
export const data = [
    {
        i: 0,
        n: 'Subatomic',
        u: true,
        l: [
            {
                i: 0,
                n: 'Quark',
                u: true,
                g: 1,
                info: 'Quarks are some of the most basic building block. They come in 6 types: Up, Down, Charm, Strange, Top, and Bottom. In this game we are only using Up and Down.',
                f: [
                    { i: 0, n: 'Up', m: .3, u: MassUnits.Da, c: [] },
                    { i: 1, n: 'Down', m: .4, u: MassUnits.Da, c: [] }
                ]
            },
            {
                i: 1,
                n: 'Lepton',
                u: true,
                g: 1,
                info: 'Leptons are some of the most basic building block. They come in 6 types: Electron, Muon, Tau, Electron Neutrino, Muon Neutrino, and Tau Neutrino. In this game we are only using Electrons.',
                f: [
                    { i: 0, n: 'Electron', m: 0, u: MassUnits.Da, c: [] }
                ]
            },
            {
                i: 2,
                n: 'Baryons',
                u: false,
                g: 2,
                info: 'Baryons are made of 3 Quarks. There are a few dozen different types of Baryons. In this game we are only using Protons and Neutrons.',
                f: [
                    { i: 0, n: 'Proton', m: 1, u: MassUnits.Da, c: [{ g: 0, i: 0, f: 0, a: 2 }, { g: 0, i: 0, f: 2, a: 1 }] },
                    { i: 1, n: 'Neutron', m: 1, u: MassUnits.Da, c: [{ g: 0, i: 0, f: 0, a: 1 }, { g: 0, i: 0, f: 2, a: 2 }] }
                ]
            },
        ]
    },
    {
        i: 1,
        n: 'Atomic',
        u: true,
        l: [
            {
                i: 0,
                n: 'Hydrogen',
                u: true,
                g: 3,
                info: 'Hydrogen is the most common element in the universe, made with only a single proton. There are two stable isotopes.',
                f: [
                    { i: 0, n: '1-H', m: 1, u: MassUnits.Da, c: [{ g: 0, i: 2, f: 0, a: 1 }, { g: 0, i: 1, f: 0, a: 1 }] },
                    { i: 1, n: '2-H', m: 1, u: MassUnits.Da, c: [{ g: 0, i: 2, f: 0, a: 1 }, { g: 0, i: 2, f: 1, a: 1 }, { g: 0, i: 1, f: 0, a: 1 }] },
                ]
            },
            {
                i: 1,
                n: 'Helium',
                u: true,
                g: 3,
                info: 'Helium has two stable isotopes. Helium-3 is much more rare than the normal Helium-4.',
                f: [
                    { i: 0, n: '3-He', m: 1, u: MassUnits.Da, c: [{ g: 0, i: 2, f: 0, a: 2 }, { g: 0, i: 2, f: 1, a: 1 }, { g: 0, i: 1, f: 0, a: 2 }] },
                    { i: 1, n: '4-He', m: 1, u: MassUnits.Da, c: [{ g: 0, i: 2, f: 0, a: 2 }, { g: 0, i: 2, f: 1, a: 2 }, { g: 0, i: 1, f: 0, a: 2 }] },
                ]
            }
        ]
    }
];
