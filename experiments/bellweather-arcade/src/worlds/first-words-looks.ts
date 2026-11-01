// The named characters' looks for The First Words, built from the shared body kit's parts.
import { face, type Look } from '../kit/body-kit';

/** Mira: Zip's friend, the courier's courier. A wide sun hat with a teal ribbon,
 *  an orange vest over a cream shirt, a teal skirt and a satchel full of map pages. */
export const MIRA_LOOK: Look = {
  height: .9,
  parts: [
    ...face('#d9a07a', '#2f3552'),
    { part: 'hair.bob', main: '#2f3552' },
    { part: 'hat.wide', main: '#ead08f', accent: '#2fa79a' },
    { part: 'top.vest', main: '#f4e8d2', accent: '#d9733a' },
    { part: 'arms.sleeve', main: '#f4e8d2', accent: '#2fa79a' },
    { part: 'arms.puff', main: '#f4e8d2' },
    { part: 'lower.skirt', main: '#2e6f6a', accent: '#ead08f' },
    { part: 'legs.stockings', main: '#3a3550' },
    { part: 'shoes.boot', main: '#6a4630' },
    { part: 'bag.satchel', main: '#8c5a34', accent: '#e2b45c' },
    { part: 'bag.strap', main: '#6e4428' },
  ],
};

/** Tavi: the young weaver of Loom Isle. A sky-blue scarf (the colour of the threads he spins),
 *  a rust tunic, a work apron. */
export const TAVI_LOOK: Look = {
  height: .95,
  parts: [
    ...face('#c99576', '#5a3a28'),
    { part: 'hair.short', main: '#5a3a28' },
    { part: 'top.tunic', main: '#c46a4e', accent: '#e8c070' },
    { part: 'arms.sleeve', main: '#c46a4e', accent: '#6fb8e8' },
    { part: 'shawl.wrap', main: '#6fb8e8' },
    { part: 'lower.apron', main: '#efe4cf' },
    { part: 'legs.trousers', main: '#4a5470' },
    { part: 'shoes.boot', main: '#5a3a28' },
  ],
};

/** Oriel: the bard of Chime Isle. A plum beret with a gold band, a long plum coat, a gold shawl. */
export const ORIEL_LOOK: Look = {
  height: 1.0,
  parts: [
    ...face('#8a5a44', '#2b2220'),
    { part: 'hair.long', main: '#2b2220' },
    { part: 'hat.beret', main: '#7a3a6a', accent: '#e2b45c' },
    { part: 'top.vest', main: '#f4e8d2', accent: '#7a3a6a' },
    { part: 'arms.sleeve', main: '#f4e8d2', accent: '#e2b45c' },
    { part: 'arms.puff', main: '#f4e8d2' },
    { part: 'shawl.wrap', main: '#e2b45c' },
    { part: 'lower.coat', main: '#5a2f5a' },
    { part: 'shoes.boot', main: '#3a2a22' },
  ],
};
