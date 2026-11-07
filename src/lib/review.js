import { CLASS_ORDER, classifyLoss, cpToWinPercent, moveAccuracy } from './analysis.js';
import { uciToSan } from './game.js';
import { detectPhase } from './weakness.js';
 
// Menggabungkan langkah (dari PGN) dengan evaluasi (dari engine) menjadi review.
// evals[i] = evaluasi posisi SEBELUM langkah ke-i; evals[n] = posisi akhir.
export function buildReview(moves, evals) {
  const reviewMoves = moves.map((m, i) => {
    const sign = m.color === 'w' ? 1 : -1; // ubah ke sudut pandang pemain yang melangkah
    const before = sign * evals[i].whiteCp;
    const after = sign * evals[i + 1].whiteCp;
    const isBest = evals[i].bestUci === m.uci;
    const rawLoss = cpToWinPercent(before) - cpToWinPercent(after);
    const loss = isBest ? 0 : Math.max(0, rawLoss);
    const bestUci = evals[i].bestUci;
 
    return {
      ...m,
      cls: classifyLoss(loss, isBest),
      loss,
      accuracy: moveAccuracy(loss),
      evalWhiteAfter: evals[i + 1].whiteCp,
      moverCpBefore: before,
      moverCpAfter: after,
      bestUci,
      bestSan: bestUci ? uciToSan(m.fenBefore, bestUci) : null,
      phase: detectPhase(m.fenBefore),
    };
  });
 
  return {
    moves: reviewMoves,
    evals: evals.map((e) => e.whiteCp),
    summary: summarize(reviewMoves),
  };
}
 
export function summarize(reviewMoves) {
  const make = () => ({ counts: Object.fromEntries(CLASS_ORDER.map((c) => [c, 0])), accuracy: 0, moves: 0 });
  const out = { w: make(), b: make() };
  for (const m of reviewMoves) {
    const side = out[m.color];
    side.counts[m.cls] += 1;
    side.accuracy += m.accuracy;
    side.moves += 1;
  }
  for (const side of [out.w, out.b]) side.accuracy = side.moves ? side.accuracy / side.moves : 0;
  return out;
}
