import { ItemMap, FlavorMap, ComponentMap, MassUnits } from "./types.js";
//flavors
const saQ_Up = {
  n: 'Up',
  m: .3,
  u: MassUnits.Da,
  c: []
};
const saQ_Down = {
  n: 'Down',
  m: .4,
  u: MassUnits.Da,
  c: []
};
const saL_Electron = {
  n: 'Electron',
  m: 0,
  u: MassUnits.Da,
  c: []
};
const saB_Proton = {
  n: 'Proton',
  m: 1,
  u: MassUnits.Da,
  c: [{
    f: saQ_Up,
    a: 2
  }, {
    f: saQ_Down,
    a: 1
  }]
};
const saB_Neutron = {
  n: 'Neutron',
  m: 1,
  u: MassUnits.Da,
  c: [{
    f: saQ_Up,
    a: 1
  }, {
    f: saQ_Down,
    a: 2
  }]
};
const aH_Protium = {
  n: 'Protium',
  m: 1,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 1
  }, {
    f: saL_Electron,
    a: 1
  }]
};
const aH_Deuterium = {
  n: 'Deuterium',
  m: 2,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 1
  }, {
    f: saB_Neutron,
    a: 1
  }, {
    f: saL_Electron,
    a: 1
  }]
};
const aH_Tritium = {
  n: 'Tritium',
  m: 3,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 1
  }, {
    f: saB_Neutron,
    a: 2
  }, {
    f: saL_Electron,
    a: 1
  }]
};
const aHe_3 = {
  n: 'Helium-3',
  m: 3,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 2
  }, {
    f: saB_Neutron,
    a: 1
  }, {
    f: saL_Electron,
    a: 2
  }]
};
const aHe_4 = {
  n: 'Helium-4',
  m: 4,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 2
  }, {
    f: saB_Neutron,
    a: 3
  }, {
    f: saL_Electron,
    a: 2
  }]
};
const aLi_6 = {
  n: 'Lithium-6',
  m: 6,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 3
  }, {
    f: saB_Neutron,
    a: 3
  }, {
    f: saL_Electron,
    a: 3
  }]
};
const aLi_7 = {
  n: 'Lithium-7',
  m: 7,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 3
  }, {
    f: saB_Neutron,
    a: 4
  }, {
    f: saL_Electron,
    a: 3
  }]
};
//items
const sa_Quark = {
  n: 'Quark',
  u: true,
  g: 1,
  info: 'Quarks are some of the most basic building block. They come in 6 types: Up, Down, Charm, Strange, Top, and Bottom. In this game we are only using Up and Down.',
  c: [saQ_Up, saQ_Down]
};
const sa_Lepton = {
  n: 'Lepton',
  u: true,
  g: 1,
  info: 'Leptons are some of the most basic building block. They come in 6 types: Electron, Muon, Tau, Electron Neutrino, Muon Neutrino, and Tau Neutrino. In this game we are only using Electrons.',
  c: [saL_Electron]
};
const sa_Baryon = {
  n: 'Baryon',
  u: false,
  g: 1,
  info: 'Baryons are made of 3 Quarks. There are a few dozen different types of Baryons. In this game we are only using Protons and Neutrons.',
  c: [saB_Proton, saB_Neutron]
};
const a_H = {
  n: 'Hydrogen',
  u: false,
  g: 2,
  info: 'Hydrogen is the most common element in the universe, made with only a single proton. There are two stable isotopes and a third with a halflife of ~12 years.',
  c: [aH_Protium, aH_Deuterium, aH_Tritium]
};
const a_He = {
  n: 'Helium',
  u: false,
  g: 2,
  info: 'Helium has two stable isotopes. Helium-3 is much more rare than the normal Helium-4.',
  c: [aHe_3, aHe_4]
};
const a_Li = {
  n: 'Lithium',
  u: false,
  g: 2,
  info: 'Lithium has two stable isotopes. Lithium-6 is much more rare than the normal Lithium-7.',
  c: [aLi_6, aLi_7]
};
//groups
const sa = {
  n: 'Subatomic',
  u: true,
  info: 'Subatomic components are the most basic building blocks we currently know about. There are some theories about what they might be made out of but nothing has been proven yet.',
  c: [sa_Quark, sa_Lepton, sa_Baryon]
};
const atomic = {
  n: 'Atomic',
  u: false,
  info: 'Atoms are basic elements that are the building blocks for every other molecule. They have an atom, which is made of Protons and Neutrons, and are `orbited` by Electrons.',
  c: [a_H, a_He, a_Li]
};
export const data = [sa, atomic];
export function buildMaps() {
  data.forEach(g => {
    g.c.forEach(i => {
      if (ItemMap[i.n]) {
        console.error('Item already exists: ' + i.n);
      }
      ItemMap[i.n] = g;
      i.c.forEach(f => {
        if (FlavorMap[f.n]) {
          console.error('Flavor already exists: ' + f.n);
        }
        FlavorMap[f.n] = i;
        f.c.forEach(c => {
          if (!ComponentMap[c.f.n]) {
            ComponentMap[c.f.n] = [];
          }
          ComponentMap[c.f.n].push(f);
        });
      });
    });
  });
}
export function load() {}
export function save() {}