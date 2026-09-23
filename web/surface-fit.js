/* Bounded-surface fit (docs/GAME-PRESENTATION-GUIDE.md rule I10).

   A surface with a height budget that holds a decision must keep the decision visible at
   any text size the player chose. Scrolling to reach a choice is not a choice at the
   moment of deciding, and raising the budget gives the obstruction back, so the surface
   sheds instead: its author ranks every optional section by rung (lowest rung first) with
   data-shed-item, and the fitter hides ranks, lowest first, until the content fits.

   An item may opt out with data-critical, the same marker the world layer uses for a
   carrier that must not fold. Instruction is not optional presentation: a hint the
   player has to ask for and that then disappears for lack of room teaches nothing, so
   the beat that cannot fit it is the beat with too much text on it.

   It converges in one call, in both directions. Restoring a single rank per call made a
   surface take several ticks to hand a section back after the text got smaller, so the
   player kept seeing the previous size's shed and any measurement taken in that window
   described a layout nobody was looking at. */
export function fitBoundedSurface(surface) {
  const items = [...surface.querySelectorAll('[data-shed-item]')]
    .filter((el) => el.dataset.critical !== 'true');
  if (!items.length) return null;
  const rank = (el) => Number(el.dataset.shedItem);
  const ranks = [...new Set(items.map(rank))].sort((a, b) => a - b);
  const overflowing = () => surface.scrollHeight > surface.clientHeight + 1;
  const shed = () => items.filter((el) => el.classList.contains('shed'));
  // Steady state is the common call: nothing shed, nothing overflowing. It must cost one
  // overflow comparison, not a class rewrite and a reflow.
  if (!shed().length && !overflowing()) return { shed: 0, fits: true };
  for (const el of items) el.classList.remove('shed');
  for (const level of ranks) {
    if (!overflowing()) break;
    for (const el of items) if (rank(el) === level) el.classList.add('shed');
  }
  return { shed: shed().length, fits: !overflowing() };
}
