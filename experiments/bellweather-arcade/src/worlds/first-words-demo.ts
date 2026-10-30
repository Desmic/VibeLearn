// The demo's ending (after Stop 3): a last look at the Warden's engine at dusk, a thought, and a
// card. Words only; the shot and timing live in story.ts.
export const DEMO_END = {
  /** seconds after Stop 3's last thought before the camera rises */
  delay: 8,
  thought: { text: ['That light. That\'s where she is.', 'Hold on, Mira. Four more isles.'] },
  card: {
    title: 'End of the demo',
    lines: ['Mira is still out there, somewhere inside the Warden\'s engine.', 'The chase goes on in the full game.'],
    // run 30: "the spark hunt went nowhere at the end with no hint": say where the rest are
    sparks: (found: number, total: number, left: [string, number][]) => `Stray sparks of Zip's voice found: ${found} of ${total}` +
      (left.length ? `. Still out there: ${left.map(([p, n]) => `${n} ${p}`).join(', ')}.` : '. Every one. Zip thanks you.'),
    /** where a stray spark is, by its id */
    place: (id: string) => id.startsWith('blossom') ? 'on Blossom Isle' : id.startsWith('loom') ? 'on Loom Isle' : id.startsWith('chime') ? 'on Chime Isle' : 'in the garden',
    stay: 'Keep exploring', title_: 'Back to the title',
  },
};
