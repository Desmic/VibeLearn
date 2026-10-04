// The First Words' save: the kit's save (kit/save.ts) with this game's keys and checkpoints.
import { createSave } from './kit/save';
import { GAME } from './game';
export type Checkpoint = 'spark' | 'skiff' | 'land' | 'gate-open' | 'loom' | 'loom-done';
export const PLACE = GAME.progress.names as Record<Checkpoint, string>;
export const save = createSave<Checkpoint>(GAME.storage, GAME.progress);
