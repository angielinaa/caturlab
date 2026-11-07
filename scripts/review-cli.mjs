// Review game langsung dari terminal (tanpa browser).
// Pemakaian:  node scripts/review-cli.mjs [file.pgn] [depth]
// Tanpa file, memakai game contoh. Berguna untuk menguji engine dan logika review.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { analyzeGame } from '../src/lib/analyze.js';
import { CLASS_INFO } from '../src/lib/analysis.js';
import { parsePgn } from '../src/lib/game.js';
import { buildReview } from '../src/lib/review.js';
import { parseBestMove, parseInfoLine } from '../src/lib/uci.js';
import { SAMPLE_PGN } from '../src/data/samples.js';
 
const [file, depthArg] = process.argv.slice(2);
const depth = Number(depthArg) || 10;
const pgn = file ? readFileSync(file, 'utf8') : SAMPLE_PGN;
 
// Engine versi Node: proses Stockfish yang diajak bicara lewat stdin/stdout.
const proc = spawn('node', ['node_modules/stockfish/bin/stockfish-19-lite-single.js']);
const rl = createInterface({ input: proc.stdout });
const lines = [];
let wake = null;
rl.on('line', (line) => {
  lines.push(line);
  wake?.();
});
 
async function nextLine() {
  while (lines.length === 0) await new Promise((resolve) => (wake = resolve));
  return lines.shift();
}
 
async function evaluate(fen, d) {
  proc.stdin.write(`position fen ${fen}\ngo depth ${d}\n`);
  let last = null;
  for (;;) {
    const line = await nextLine();
    const info = parseInfoLine(line);
    if (info && !info.bound) last = info;
    if (line.startsWith('bestmove')) {
      return { cp: last?.cp ?? null, mate: last?.mate ?? null, bestUci: parseBestMove(line) };
    }
  }
}
 
const game = parsePgn(pgn);
console.log(`Menganalisis ${game.moves.length} langkah (depth ${depth})...`);
const evals = await analyzeGame(game.positions, evaluate, {
  depth,
  onProgress: (done, total) => process.stdout.write(`\r${done}/${total}`),
});
console.log('');
 
const review = buildReview(game.moves, evals);
for (const m of review.moves) {
  const no = m.color === 'w' ? `${m.moveNumber}.` : `${m.moveNumber}...`;
  const label = CLASS_INFO[m.cls].label.padEnd(14);
  const best = m.cls === 'best' ? '' : `  (terbaik: ${m.bestSan})`;
  console.log(`${no.padEnd(6)}${m.san.padEnd(8)}${label}${m.loss.toFixed(1).padStart(5)}%${best}`);
}
const { w, b } = review.summary;
console.log(`\nAkurasi putih: ${w.accuracy.toFixed(1)}%  |  hitam: ${b.accuracy.toFixed(1)}%`);
 
proc.stdin.write('quit\n');
proc.kill();
process.exit(0);
