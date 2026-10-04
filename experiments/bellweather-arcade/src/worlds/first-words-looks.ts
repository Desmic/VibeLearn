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
