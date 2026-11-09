// Mainkan satu game uji: engine melawan engine, lalu simpan PGN-nya.
// Pemakaian: node scripts/play-cli.mjs [levelPutih] [levelHitam] [maksPly] [file.pgn]
// Contoh: node scripts/play-cli.mjs kuat pemula 80 game-uji.pgn
// Lalu review: node scripts/review-cli.mjs game-uji.pgn 10
import { writeFileSync } from 'node:fs';
import { LEVELS, applyUci, buildPgn, replay } from '../src/lib/play.js';
import { startEngine } from './engine-node.mjs';
 
const [whiteId = 'kuat', blackId = 'pemula', maxPlyArg, out = 'game-uji.pgn'] = process.argv.slice(2);
const levelOf = (id) => LEVELS.find((l) => l.id === id) ?? LEVELS[2];
const levels = { w: levelOf(whiteId), b: levelOf(blackId) };
const maxPly = Number(maxPlyArg) || 80;
 
const engine = startEngine();
const sans = [];
let state = replay(sans);
while (!state.status.over && sans.length < maxPly) {
  const level = levels[state.turn];
  const { bestUci } = await engine.search(state.fen, { depth: level.depth, skill: level.skill });
  const move = applyUci(state.fen, bestUci);
  if (!move.legal) throw new Error(`Engine memberi langkah ilegal: ${bestUci}`);
  sans.push(move.san);
  state = replay(sans);
}
engine.close();
 
const pgn = buildPgn(sans, {
  white: `Stockfish ${levels.w.label}`,
  black: `Stockfish ${levels.b.label}`,
  result: state.status.result,
});
writeFileSync(out, pgn + '\n');
console.log(`${sans.length} ply dimainkan. ${state.status.text || 'Game dihentikan karena batas langkah.'}`);
console.log(`PGN disimpan ke ${out}`);
process.exit(0);
