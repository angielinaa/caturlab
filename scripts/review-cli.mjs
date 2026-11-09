// Review game langsung dari terminal (tanpa browser).
// Pemakaian: node scripts/review-cli.mjs [file.pgn] [depth]
// Tanpa file, memakai game contoh. Berguna untuk menguji engine dan logika review.
import { readFileSync } from 'node:fs';
import { analyzeGame } from '../src/lib/analyze.js';
import { CLASS_INFO } from '../src/lib/analysis.js';
import { explainBetter, explainMove } from '../src/lib/explain.js';
import { parsePgn } from '../src/lib/game.js';
import { ISSUE_CLASSES, buildReview } from '../src/lib/review.js';
import { SAMPLE_PGN } from '../src/data/samples.js';
import { startEngine } from './engine-node.mjs';
 
const [file, depthArg] = process.argv.slice(2);
const depth = Number(depthArg) || 10;
const pgn = file ? readFileSync(file, 'utf8') : SAMPLE_PGN;
 
const engine = startEngine();
const game = parsePgn(pgn);
console.log(`Menganalisis ${game.moves.length} langkah (depth ${depth})...`);
const evals = await analyzeGame(game.positions, (fen, d, multipv) => engine.search(fen, { depth: d, multipv }), {
  depth,
  onProgress: (done, total) => process.stdout.write(`\r${done}/${total}`),
});
console.log('');
 
const review = buildReview(game.moves, evals);
for (const m of review.moves) {
  const no = m.color === 'w' ? `${m.moveNumber}.` : `${m.moveNumber}...`;
  const label = CLASS_INFO[m.cls].label.padEnd(17);
  const best = m.cls === 'best' || m.cls === 'great' ? '' : `  (terbaik: ${m.bestSan})`;
  console.log(`${no.padEnd(6)}${m.san.padEnd(8)}${label}${m.loss.toFixed(1).padStart(5)}%${best}`);
  if (ISSUE_CLASSES.includes(m.cls)) {
    console.log(`        ${explainMove(m)}`);
    const better = explainBetter(m);
    if (better) console.log(`        ${better}`);
  }
}
const { w, b } = review.summary;
console.log(`\nAkurasi putih: ${w.accuracy.toFixed(1)}%  |  hitam: ${b.accuracy.toFixed(1)}%`);
engine.close();
process.exit(0);
