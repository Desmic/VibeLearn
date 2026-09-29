import test from 'node:test';
import assert from 'node:assert/strict';
import { createEncounter } from './encounter.ts';

const make = () => createEncounter({activation:[2,-4],reunion:[14,-19],radius:2});

test('reaching either place without acting changes nothing', () => {
  const encounter=make();
  assert.equal(encounter.available([2,-4]),'wake');
  assert.equal(encounter.phase,'waiting');
  assert.equal(encounter.available([14,-19]),null);
  assert.equal(encounter.phase,'waiting');
});

test('far actions fail, while explicit wake latches once', () => {
  const encounter=make();
  assert.equal(encounter.act([5,-4]),null);
  assert.equal(encounter.phase,'waiting');
  assert.equal(encounter.act([4,-4]),'wake'); // Exactly on the radius.
  assert.equal(encounter.phase,'awakened');
  assert.equal(encounter.act([2,-4]),null);
  assert.equal(encounter.phase,'awakened');
});

test('joining requires prior wake and a separate explicit action at reunion', () => {
  const encounter=make();
  assert.equal(encounter.act([14,-19]),null);
  assert.equal(encounter.act([2,-4]),'wake');
  assert.equal(encounter.available([14,-19]),'join');
  assert.equal(encounter.phase,'awakened');
  assert.equal(encounter.act([11,-19]),null);
  assert.equal(encounter.phase,'awakened');
  assert.equal(encounter.act([14,-19]),'join');
  assert.equal(encounter.phase,'reunited');
  assert.equal(encounter.available([14,-19]),null);
  assert.equal(encounter.act([14,-19]),null);
});

test('reset restores the opening phase after reunion', () => {
  const encounter=make();
  encounter.act([2,-4]);
  encounter.act([14,-19]);
  encounter.reset();
  assert.equal(encounter.phase,'waiting');
  assert.equal(encounter.available([2,-4]),'wake');
  assert.equal(encounter.available([14,-19]),null);
});

test('alternate position and scale fixture follows the same contract', () => {
  const encounter=createEncounter({activation:[-0.5,100.25],reunion:[-300,1],radius:0.4});
  assert.equal(encounter.available([-0.5,100.66]),null);
  assert.equal(encounter.act([-0.5,100.25]),'wake');
  assert.equal(encounter.available([-300,1.39]),'join');
  assert.equal(encounter.act([-300,1.39]),'join');
  assert.equal(encounter.phase,'reunited');
});

test('invalid inputs are rejected and later config mutation cannot move the targets', () => {
  for(const bad of [NaN,Infinity,-Infinity,0,-1]) {
    assert.throws(()=>createEncounter({activation:[0,0],reunion:[2,2],radius:bad}));
  }
  assert.throws(()=>createEncounter({activation:[NaN,0],reunion:[2,2],radius:1}));
  assert.throws(()=>createEncounter({activation:[0,0],reunion:[2,Infinity],radius:1}));
  const activation=[0,0],reunion=[4,0];
  const encounter=createEncounter({activation,reunion,radius:1});
  activation[0]=40;reunion[0]=80;
  assert.equal(encounter.available([0,0]),'wake');
  assert.throws(()=>encounter.available([Infinity,0]));
  assert.throws(()=>encounter.act([0,NaN]));
  assert.equal(encounter.phase,'waiting');
});
