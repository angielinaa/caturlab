import { CLASS_ORDER, MATE_CP, classifyLoss, cpToWinPercent, moveAccuracy, refineClass } from './analysis.js';
import { uciToSan } from './game.js';
import { describeBetter, describeProblem, fenAfterMove } from './tactics.js';
import { detectPhase } from './weakness.js';
 
// Label yang dianggap "masalah" (dipakai tombol lompat dan daftar momen kunci).
export const ISSUE_CLASSES = ['mistake', 'miss', 'blunder'];
 
// Menggabungkan langkah (dari PGN) dengan evaluasi (dari engine) menjadi review.
// evals[i] = evaluasi posisi SEBELUM langkah ke-i; evals[n] = posisi akhir.
export function buildReview(moves, evals) {
  // Putaran 1: loss tiap langkah (peluang menang yang hilang).
  const info = moves.map((m, i) => {
    const sign = m.color === 'w' ? 1 : -1; // ubah ke sudut pandang pemain yang melangkah
    const before = sign * evals[i].whiteCp;
    const after = sign * evals[i + 1].whiteCp;
    const isBest = evals[i].bestUci === m.uci;
    const rawLoss = cpToWinPercent(before) - cpToWinPercent(after);
    const loss = isBest ? 0 : Math.max(0, rawLoss);
    const second = evals[i].secondWhiteCp;
    const winSecond = second === null || second === undefined ? null : cpToWinPercent(sign * second);
    return { before, after, isBest, loss, winBefore: cpToWinPercent(before), winSecond };
  });
 
  // Putaran 2: klasifikasi (butuh loss langkah lawan sebelumnya) dan penjelasan.
  const reviewMoves = moves.map((m, i) => {
    const { before, after, isBest, loss, winBefore, winSecond } = info[i];
    const prevLoss = i > 0 ? info[i - 1].loss : 0;
    const hadMate = before >= MATE_CP - 1;
    const gotMated = after <= -(MATE_CP - 1);
    const cls = refineClass(classifyLoss(loss, isBest), { isBest, winBefore, winSecond, prevLoss, hadMate });
    const bestUci = evals[i].bestUci;
    const replyUci = evals[i + 1].bestUci; // balasan terbaik lawan setelah langkah ini
    const needsExplain = loss >= 5;
    return {
      ...m,
      cls,
      loss,
      prevLoss,
      accuracy: moveAccuracy(loss),
      evalWhiteAfter: evals[i + 1].whiteCp,
      moverCpBefore: before,
      moverCpAfter: after,
      hadMate,
      gotMated,
      bestUci,
      bestSan: bestUci ? uciToSan(m.fenBefore, bestUci) : null,
      fenIfBest: bestUci ? fenAfterMove(m.fenBefore, bestUci) : null,
      replyUci,
      why: needsExplain ? describeProblem({ fenAfter: m.fenAfter, uci: m.uci, replyUci, gotMated }) : null,
      better: bestUci && !isBest ? describeBetter({ fenBefore: m.fenBefore, bestUci, hadMate }) : null,
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
 
// Nomor ply langkah bermasalah berikutnya milik `color` ('w' atau 'b') setelah ply `fromPly`.
// Mengembalikan null jika tidak ada lagi. Dipakai tombol "Kesalahan berikutnya".
export function findNextIssue(moves, fromPly, color) {
  const next = moves.find((m) => m.ply > fromPly && m.color === color && ISSUE_CLASSES.includes(m.cls));
  return next ? next.ply : null;
}
 
// Beberapa momen paling merugikan milik `color`, dari yang terbesar.
export function keyMoments(moves, color, limit = 3) {
  return moves
    .filter((m) => m.color === color && ISSUE_CLASSES.includes(m.cls))
    .sort((a, b) => b.loss - a.loss)
    .slice(0, limit);
}