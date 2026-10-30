// The demo's ending (after Stop 3): a last look at the Warden's engine at dusk, a thought, and a
// card. Words only; the shot and timing live in story.ts.
export const DEMO_END = {
  /** seconds after Stop 3's last thought before the camera rises */
  delay: 8,
  thought: { text: ['That light. That\'s where she is.', 'Hold on, Mira. Four more isles.'] },
  card: {
    title: 'End of the demo',
    lines: ['Mira is still out there, somewhere inside the Warden\'s engine.', 'The chase goes on in the full game.'],
    sparks: (found: number, total: number) => `Stray sparks of Zip's voice found: ${found} of ${total}`,
    stay: 'Keep exploring', title_: 'Back to the title',
  },
};
