// The First Words' own test pieces (manifest.tests). Everything else the tools do comes from
// the manifest and the test contract; these are the parts only this game knows: how to get
// past its cold open, its first conversation, and its story between learning stations.
// A new game writes its own file like this one (an agent can draft it from the story data).

/** helpers added to the harness (`h.skipOpening()`, `h.talkMira()`, `h.speedrunRoute()`) */
export const helpers = h => {
  const { page } = h;
  const h2 = {
    /** from a fresh start to free play (title and cold open skipped): system tools that just need the world running use this */
    toPlay: async () => { await h.fresh('&title=0'); await h2.skipOpening(); await page.mouse.click(200, 300); await page.waitForTimeout(800); },
    // the cold open (Mira calls from the outlook) can be skipped like any cutscene
    skipOpening: async () => { await page.waitForFunction(() => window.__vlStory?.debug, null, { timeout: 30000 }); await h.waitFor(() => page.evaluate(() => window.__vlStory.debug.opening >= 0 || window.__vlStory.debug.beat !== 'meet'), 5000, 250); if ((await page.evaluate(() => window.__vlStory.debug.opening)) >= 0) await h.press(page.locator('.story-skip'), { timeout: 10000 }).catch(() => {}); await page.waitForTimeout(400); },
    // Mira's conversation, up to the attack (lines advance; "Beep?" is a real choice).
    // Mira asks for the lantern; Zip hangs it on the skiff (an action in the world), then she talks on
    talkMira: async () => { await h.card('Next'); await h.pose(2.6, -10.3, 0); await h.act('Hang'); await h.card('Beep?', 30000); await h.card('Next'); await h.card('Next'); },
    /** the speedrun's story between stations: start to the end of Stop 2, the fastest correct way */
    speedrunRoute: async ({ follow, answer, until, sim, note, beacon, visible, playStation, skipCutscene, beat, goal, check, shot }) => {
      await h.press(page.locator('.title-menu .primary')); await page.waitForTimeout(800);
      await h2.skipOpening(); await note();
      // Meet Mira, hang the lantern, sit through nothing
      await follow(/Talk/); await answer([/Beep/]);
      await follow(/Hang/); await answer([/Beep/]);
      await until(async () => (await beat()) === 'attack', 20); await note();
      await until(() => visible('.story-skip'), 10); await skipCutscene();
      await until(async () => (await beat()) === 'spark', 20); await note();
      // Catch the spark (it moves: keep re-planning toward it)
      for (let i = 0; i < 60 && (await beat()) === 'spark'; i++) { const b = await beacon(); if (b) await h.walkTo(b, { near: .3, maxSecs: 3, until: async () => (await beat()) !== 'spark' }); await sim(.4); }
      check('caught the spark', (await beat()) === 'skiff', await beat()); await note();
      // Wake the skiff: the three words it needs (never the decoy), then the engine, right first time
      await playStation('wake-skiff');
      await until(() => visible('.star-row'), 30); await note(); await h.stars(); await answer([/Board/]);
      // Fly to Blossom Isle (the flight ends by itself)
      await until(() => visible('.star-row'), 240); await note(); await h.stars();
      // Blossom Isle: satchel, only Mira's page, the gate
      await answer([/OK/]);
      await playStation('blossom-gate');
      await until(() => visible('.star-row'), 10); await note(); await h.stars();
      // The relay: Mira's channel first time
      await playStation('relay-contact');
      await answer([/coming/]); await until(() => visible('.star-row'), 10); await note(); await h.stars();
      // Stop 2: board, fly over, free Tavi with the right call first time
      await follow(/Board/); await answer([/Onward/]); await until(async () => /Loom Isle/.test(await page.locator('#place').textContent()), 30); await note();
      await playStation('loom-fit');
      await until(() => visible('.star-row'), 20); await note(); await h.stars();
      await answer([/What is it/, /Thanks/]); await until(async () => /Stop 2 for now/.test(await goal() ?? ''), 10); await note();
      check('reached the end of Stop 2', /Stop 2 for now/.test(await goal() ?? ''), await goal(), 'fail', 'flow');
      await shot('end');
    },
  };
  return h2;
};
