// Leak detection for blind play-tests (tools/AI-PLAYTEST.md). A language model is steered by
// whatever is in its context, so a tester told what to look for finds it. Two guards:
//   - briefs (the tester's instructions, personas) must carry no word from the game's design:
//     its nouns, its intent, or a priming word ("fun", "lesson", "confusing"…);
//   - before the intent is revealed, an interviewer's question may only use words the tester
//     has already met: on screen while playing, or in the tester's own answers. A word only the
//     designer knows ("context window") is a leak, and the question is refused.
// Game-agnostic: the game's words come from its manifest and its intent text.

const STOP = new Set(`a about above after again all also am an and any are as at be because been before being below between both but by can
could did do does doing done down during each else even ever every few for from further get got had has have having he her here hers him his
how i if in into is it its itself just let like made make many may me might more most much must my no nor not now of off on once one only or
other our ours out over own per same say said see seen she should so some still such than that the their theirs them then there these they
this those through to too under until up upon us very was we were what when where which while who whom why will with would yet you your
yours yourself first last next new old something anything nothing someone thing things way ways time times part parts kind lot bit back
going go went come came take took tell told tells give gave put use used using want wanted know knew think thought try tried look looked
seem seemed feel felt keep kept stop stopped start started happen happened happens moment moments again`.split(/\s+/));

/** the device and the play-test's own words: talking about these leaks nothing about a game */
export const OPERATING = new Set(`game games play played playing player players phone screen screenshot screenshots tap taps tapped tapping
touch finger thumb stick drag swipe button buttons camera move moving walk walked walking turn left right forward back step steps action actions
wait waiting minute minutes second seconds friend friends bus console adventure adventures years late early twenties thirties forties rarely
relative casual few hand handed real life naturally natural whatever muttering mutter yourself honest honestly experience reply replied file
files web search page source pixels image open show showed shown point points pointing see number scale score`.split(/\s+/));

/** words that tell a tester what to notice or how to judge */
export const PRIMING = ['fun', 'funny', 'humor', 'humour', 'joke', 'jokes', 'laugh', 'delight', 'boring', 'confus', 'clear', 'unclear', 'lesson',
  'learn', 'teach', 'educat', 'bug', 'glitch', 'broken', 'puzzle', 'mechanic', 'interface', 'ui', 'tutorial', 'intuitive', 'frustrat', 'difficult',
  'easy', 'hard', 'clever', 'story', 'character', 'goal', 'objective', 'quest', 'level', 'win', 'lose', 'fail', 'mistake', 'wrong', 'correct',
  'reward', 'score', 'star', 'limit', 'cap'];

/** crude stem, enough to match "bridges"/"bridge", "spoken"/"speaking" stems close enough */
export const stem = w => {
  w = w.toLowerCase().replace(/[’']s$/, '').replace(/[^a-z0-9-]/g, '');
  for (const s of ['ings', 'ing', 'ies', 'ied', 'ed', 'es', 'ly', 's']) if (w.length > s.length + 3 && w.endsWith(s)) return w.slice(0, -s.length);
  return w;
};
export const words = text => String(text ?? '').split(/[^A-Za-z0-9’'-]+/).map(w => w.replace(/^[-’']+|[-’']+$/g, '')).filter(Boolean);
const content = text => words(text).map(stem).filter(s => s.length > 1 && !STOP.has(s) && !STOP.has(s.toLowerCase()));

/** distinctive words of a design: nouns and every content word of its intent text that isn't operating vocabulary */
export function designVocabulary({ nouns = [], intents = [] }) {
  const v = new Set();
  for (const n of nouns) for (const w of content(n)) v.add(w);
  for (const t of intents) for (const w of content(t)) if (!OPERATING.has(w) && !OPERATING.has(w + 's')) v.add(w);
  return v;
}
const primed = s => PRIMING.find(p => s === p || (p.length >= 5 && s.startsWith(p)) || stem(p) === s);

/** words in a brief that come from the design or prime the tester: [] when clean */
export function briefLeaks(text, design) {
  const out = new Set();
  for (const s of content(text)) {
    if (OPERATING.has(s)) continue;
    if (design.has(s)) out.add(s); else if (primed(s)) out.add(s);
  }
  return [...out];
}

/** words in a pre-reveal question that the tester hasn't met (design words, priming words) */
export function questionLeaks(question, design, met) {
  const seen = new Set([...met].map(stem)), out = new Set();
  for (const s of content(question)) {
    if (seen.has(s) || OPERATING.has(s)) continue;
    if (design.has(s) || primed(s)) out.add(s);
  }
  return [...out];
}

/** everything a tester met: the words on screen in the play log, and its own words */
export function metWords(texts) { const m = new Set(); for (const t of texts) for (const w of content(t)) m.add(w); return m; }
