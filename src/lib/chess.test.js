import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { parseInfoLine, parseBestMove, summarizeSearch } from './uci.js';
import { classifyLoss, cpToWinPercent, moveAccuracy, refineClass, scoreToCp, CLASS_INFO, CLASS_ORDER, MATE_CP } from './analysis.js';
import { parsePgn, uciToSan } from './game.js';
import { analyzeGame } from './analyze.js';
import { buildReview, findNextIssue, keyMoments } from './review.js';
import { describeBetter, describeProblem, fenAfterMove } from './tactics.js';
import { explainBetter, explainMove } from './explain.js';
import { moveArrows, squareHighlights } from './highlight.js';
import { LEVELS, applyMove, applyUci, buildPgn, replay, resignResult } from './play.js';
import { detectPhase, profileFromReview, mergeProfiles, recommend, emptyProfile } from './weakness.js';
import { checkPuzzleMove } from './puzzle.js';
import { PUZZLES } from '../data/puzzles';
import { LESSONS } from '../data/lessons';
import { SAMPLE_PGN } from '../data/samples';
 
describe('uci', () => {
  it('membaca baris info cp', () => {
    const r = parseInfoLine('info depth 10 seldepth 21 multipv 1 score cp 32 nodes 25009 pv g1f3 b8c6');
    expect(r).toMatchObject({ depth: 10, cp: 32, mate: null, bound: false });
    expect(r.pv).toEqual(['g1f3', 'b8c6']);
  });
  it('membaca skor mate dan bound', () => {
    expect(parseInfoLine('info depth 5 multipv 1 score mate 3 pv a1a8').mate).toBe(3);
    expect(parseInfoLine('info depth 5 multipv 1 score cp 10 lowerbound pv a1a8').bound).toBe(true);
  });
  it('mengabaikan baris lain', () => {
    expect(parseInfoLine('info string NNUE enabled')).toBeNull();
  });
  it('membaca nomor jalur (multipv)', () => {
    expect(parseInfoLine('info depth 5 multipv 2 score cp 10 pv a1a8').multipv).toBe(2);
    expect(parseInfoLine('info depth 5 score cp 10 pv a1a8').multipv).toBe(1);
  });
  it('membaca bestmove', () => {
    expect(parseBestMove('bestmove g1f3 ponder b8c6')).toBe('g1f3');
    expect(parseBestMove('bestmove (none)')).toBeNull();
  });
});
 
describe('analysis', () => {
  it('skor mate menjadi +/- 10000', () => {
    expect(scoreToCp({ cp: null, mate: 2 })).toBe(MATE_CP);
    expect(scoreToCp({ cp: null, mate: -1 })).toBe(-MATE_CP);
    expect(scoreToCp({ cp: null, mate: 0 })).toBe(-MATE_CP);
    expect(scoreToCp({ cp: 40, mate: null })).toBe(40);
  });
  it('win percent simetris dan 50 di cp 0', () => {
    expect(cpToWinPercent(0)).toBeCloseTo(50, 5);
    expect(cpToWinPercent(300) + cpToWinPercent(-300)).toBeCloseTo(100, 5);
  });
  it('klasifikasi mengikuti ambang', () => {
    expect(classifyLoss(0.5, false)).toBe('best');
    expect(classifyLoss(3, false)).toBe('good');
    expect(classifyLoss(8, false)).toBe('inaccuracy');
    expect(classifyLoss(15, false)).toBe('mistake');
    expect(classifyLoss(40, false)).toBe('blunder');
    expect(classifyLoss(40, true)).toBe('best');
  });
  it('akurasi turun saat loss naik', () => {
    expect(moveAccuracy(0)).toBeGreaterThan(99);
    expect(moveAccuracy(30)).toBeLessThan(moveAccuracy(5));
  });
});
 
describe('game', () => {
  it('membaca PGN contoh (17 langkah, 33 ply)', () => {
    const g = parsePgn(SAMPLE_PGN);
    expect(g.moves).toHaveLength(33);
    expect(g.positions).toHaveLength(34);
    expect(g.moves[0]).toMatchObject({ san: 'e4', uci: 'e2e4', color: 'w', moveNumber: 1 });
    expect(g.moves.at(-1).san).toBe('Rd8#');
  });
  it('PGN rusak melempar error', () => {
    expect(() => parsePgn('1. e4 e5 2. Qxz9')).toThrow();
  });
  it('uciToSan', () => {
    expect(uciToSan(new Chess().fen(), 'g1f3')).toBe('Nf3');
  });
});
 
describe('review', () => {
  it('menandai blunder dan langkah terbaik dengan evaluator palsu', async () => {
    // 1.f3 e5 2.g4?? Qh4# : posisi akhir adalah skakmat untuk putih
    const g = parsePgn('1. f3 e5 2. g4 Qh4#');
    const fake = async (fen) => {
      const c = new Chess(fen);
      const table = {
        [g.positions[0]]: { cp: 0, bestUci: 'e2e4' },
        [g.positions[1]]: { cp: 0, bestUci: 'e7e5' },
        [g.positions[2]]: { cp: -30, bestUci: 'e2e4' },
        [g.positions[3]]: { cp: null, mate: 1, bestUci: 'd8h4' }, // hitam punya skakmat dalam 1
      };
      return { mate: null, ...table[c.fen()] };
    };
    const evals = await analyzeGame(g.positions, fake, { depth: 1 });
    expect(evals).toHaveLength(5);
    expect(evals[4].whiteCp).toBe(-MATE_CP); // putih sudah di-skakmat
    const r = buildReview(g.moves, evals);
    expect(r.moves[1].cls).toBe('best'); // ...e5 = langkah terbaik
    expect(r.moves[2].cls).toBe('blunder'); // g4 membuka skakmat
    expect(r.moves[3].cls).toBe('best'); // Qh4# langkah terbaik
    expect(r.summary.w.counts.blunder).toBe(1);
    expect(r.summary.b.counts.best).toBe(2);
  });
  it('analyzeGame bisa dibatalkan', async () => {
    const g = parsePgn('1. e4 e5');
    await expect(analyzeGame(g.positions, async () => ({ cp: 0 }), { shouldCancel: () => true })).rejects.toThrow('CANCELLED');
  });
});
 
describe('weakness', () => {
  it('mendeteksi fase', () => {
    expect(detectPhase(new Chess().fen())).toBe('opening');
    expect(detectPhase('r2qk2r/pp3ppp/2n5/8/8/2N5/PP3PPP/R2QK2R w KQkq - 0 20')).toBe('middlegame');
    expect(detectPhase('8/5k2/8/8/8/8/5K2/R7 w - - 0 60')).toBe('endgame');
  });
  it('profil, gabungan, dan rekomendasi', () => {
    const moves = [
      ...Array.from({ length: 4 }, () => ({ color: 'w', phase: 'endgame', cls: 'blunder' })),
      ...Array.from({ length: 4 }, () => ({ color: 'w', phase: 'opening', cls: 'best' })),
      { color: 'b', phase: 'opening', cls: 'blunder' },
    ];
    const p = profileFromReview(moves, 'white');
    expect(p.phases.endgame.blunder).toBe(4);
    expect(p.phases.opening.moves).toBe(4);
    const merged = mergeProfiles(p, p);
    expect(merged.games).toBe(2);
    expect(recommend(merged).weakestPhase).toBe('endgame');
    expect(recommend(emptyProfile())).toBeNull();
  });
});
 
describe('puzzle dan materi', () => {
  it('semua FEN puzzle valid dan solusinya legal', () => {
    for (const p of PUZZLES) {
      const chess = new Chess(p.fen);
      if (p.type === 'best') {
        for (const uci of p.solutions) {
          const r = checkPuzzleMove(p, uci.slice(0, 2), uci.slice(2, 4));
          expect(r.legal, p.id).toBe(true);
          expect(r.correct, p.id).toBe(true);
        }
      } else {
        const mates = chess.moves({ verbose: true }).filter((m) => {
          const c = new Chess(p.fen);
          c.move(m);
          return c.isCheckmate();
        });
        expect(mates.length, p.id).toBeGreaterThan(0);
      }
    }
  });
  it('langkah salah ditolak, langkah ilegal tidak legal', () => {
    const p2 = PUZZLES.find((p) => p.id === 'p2');
    expect(checkPuzzleMove(p2, 'g1', 'g2').correct).toBe(false);
    expect(checkPuzzleMove(p2, 'd5', 'd8').legal).toBe(false);
  });
  it('FEN contoh di materi valid', () => {
    for (const l of LESSONS) if (l.fen) expect(() => new Chess(l.fen)).not.toThrow();
  });
});
 
describe('summarizeSearch', () => {
  it('mengambil jalur terbaik, terbaik kedua, dan bestmove', () => {
    const r = summarizeSearch([
      'info depth 8 multipv 1 score cp 20 pv e2e4 e7e5',
      'info depth 8 multipv 2 score cp -10 pv d2d4 d7d5',
      'info depth 9 multipv 1 score cp 35 pv e2e4 c7c5',
      'info depth 9 multipv 2 score cp 5 lowerbound pv d2d4',
      'info depth 9 multipv 2 score cp 12 pv g1f3 d7d5',
      'bestmove e2e4 ponder c7c5',
    ]);
    expect(r).toMatchObject({ cp: 35, depth: 9, bestUci: 'e2e4' });
    expect(r.pv).toEqual(['e2e4', 'c7c5']);
    expect(r.second).toEqual({ cp: 12, mate: null });
  });
  it('tanpa jalur kedua, second bernilai null', () => {
    const r = summarizeSearch(['info depth 3 multipv 1 score mate 2 pv a1a8', 'bestmove a1a8']);
    expect(r.mate).toBe(2);
    expect(r.second).toBeNull();
  });
});
 
describe('label tambahan', () => {
  it('semua label punya nama dan warna', () => {
    for (const c of CLASS_ORDER) expect(CLASS_INFO[c].label && CLASS_INFO[c].color, c).toBeTruthy();
  });
  it('sangat baik: terbaik dan jauh di atas alternatif kedua', () => {
    const base = { isBest: true, winBefore: 60, prevLoss: 0, hadMate: false };
    expect(refineClass('best', { ...base, winSecond: 30 })).toBe('great');
    expect(refineClass('best', { ...base, winSecond: 55 })).toBe('best');
    expect(refineClass('best', { ...base, winSecond: null })).toBe('best');
    expect(refineClass('best', { ...base, winBefore: 97, winSecond: 50 })).toBe('best');
  });
  it('peluang terlewat: kurang akurat setelah lawan salah, atau melewatkan skakmat', () => {
    const base = { isBest: false, winBefore: 80, winSecond: null, hadMate: false };
    expect(refineClass('inaccuracy', { ...base, prevLoss: 25 })).toBe('miss');
    expect(refineClass('mistake', { ...base, prevLoss: 0, hadMate: true })).toBe('miss');
    expect(refineClass('mistake', { ...base, prevLoss: 0 })).toBe('mistake');
    expect(refineClass('blunder', { ...base, prevLoss: 40 })).toBe('blunder');
  });
});
 
describe('review: label baru', () => {
  const ev = (whiteCp, bestUci = null, secondWhiteCp = null) => ({ whiteCp, bestUci, pv: bestUci ? [bestUci] : [], secondWhiteCp });
 
  it('blunder yang membuka skakmat, lengkap dengan penjelasan', () => {
    // 1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6?? 4.Qxf7#
    const g = parsePgn('1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#');
    const evals = g.positions.map(() => ev(40));
    evals[5] = ev(40, 'g7g6'); // sebelum 3...Nf6: g6 menahan serangan
    evals[6] = ev(MATE_CP, 'h5f7'); // setelah 3...Nf6: putih punya skakmat
    evals[7] = ev(MATE_CP); // posisi akhir (skakmat)
    const m = buildReview(g.moves, evals).moves[5];
    expect(m.san).toBe('Nf6');
    expect(m.cls).toBe('blunder');
    expect(m.why).toMatchObject({ kind: 'mate', replySan: 'Qxf7#' });
    expect(explainMove(m)).toContain('Qxf7#');
    expect(explainMove(m)).toContain('skakmat');
    expect(m.bestSan).toBe('g6');
    expect(explainBetter(m)).toContain('g6');
  });
 
  it('sangat baik dan peluang terlewat dari data engine buatan', () => {
    const g = parsePgn('1. e4 e5 2. Nf3 Nc6');
    const evals = [
      ev(20, 'e2e4', -200), // 1.e4 terbaik, alternatif kedua jauh lebih buruk
      ev(20, 'g8f6'), // 1...e5 bukan pilihan engine
      ev(400, 'd2d4'), // setelah 1...e5 putih tiba-tiba unggul besar
      ev(200, 'b8c6'), // 2.Nf3 menyia-nyiakan sebagian keunggulan itu
      ev(200),
    ];
    const r = buildReview(g.moves, evals);
    expect(r.moves[0].cls).toBe('great');
    expect(r.moves[1].cls).toBe('blunder');
    expect(r.moves[2].prevLoss).toBeGreaterThan(10);
    expect(r.moves[2].cls).toBe('miss');
    expect(r.summary.w.counts.great).toBe(1);
    expect(r.summary.w.counts.miss).toBe(1);
  });
 
  it('findNextIssue dan keyMoments', () => {
    const moves = [
      { ply: 1, color: 'w', cls: 'best', loss: 0 },
      { ply: 2, color: 'b', cls: 'blunder', loss: 40 },
      { ply: 3, color: 'w', cls: 'mistake', loss: 15 },
      { ply: 4, color: 'b', cls: 'good', loss: 2 },
      { ply: 5, color: 'w', cls: 'miss', loss: 8 },
      { ply: 6, color: 'b', cls: 'mistake', loss: 12 },
    ];
    expect(findNextIssue(moves, 0, 'w')).toBe(3);
    expect(findNextIssue(moves, 3, 'w')).toBe(5);
    expect(findNextIssue(moves, 5, 'w')).toBeNull();
    expect(keyMoments(moves, 'w', 2).map((m) => m.ply)).toEqual([3, 5]);
    expect(keyMoments(moves, 'b').map((m) => m.ply)).toEqual([2, 6]);
  });
});
 
describe('tactics dan penjelasan', () => {
  it('bidak menggantung: lawan memakan tanpa bisa dibalas', () => {
    // 1.e4 e5 2.Nf3 Nc6 3.Nxe5? Nxe5 : kuda putih di e5 dimakan, tidak bisa dibalas
    const g = parsePgn('1. e4 e5 2. Nf3 Nc6 3. Nxe5 Nxe5');
    const ply5 = g.moves[4];
    const why = describeProblem({ fenAfter: ply5.fenAfter, uci: ply5.uci, replyUci: 'c6e5', gotMated: false });
    expect(why).toMatchObject({ kind: 'hanging', piece: 'n', square: 'e5', movedPiece: true });
  });
  it('langkah yang lebih baik: menangkap, skakmat, dan fenAfterMove', () => {
    const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
    expect(describeBetter({ fenBefore: fen, bestUci: 'h5f7', hadMate: false })).toMatchObject({ kind: 'mate', san: 'Qxf7#' });
    const after = fenAfterMove(fen, 'h5f7');
    expect(new Chess(after).isCheckmate()).toBe(true);
    expect(fenAfterMove(fen, 'a1a8')).toBeNull();
    const cap = describeBetter({ fenBefore: 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3', bestUci: 'f3h4', hadMate: false });
    expect(cap).toMatchObject({ kind: 'capture', captured: 'q' });
  });
});
 
describe('highlight', () => {
  const m = { uci: 'e2e4', bestUci: 'd2d4', cls: 'blunder' };
  it('menyorot petak langkahmu dan petak langkah yang lebih baik', () => {
    expect(Object.keys(squareHighlights(m, 'played')).sort()).toEqual(['e2', 'e4']);
    expect(Object.keys(squareHighlights(m, 'better')).sort()).toEqual(['d2', 'd4']);
    expect(squareHighlights(null)).toEqual({});
  });
  it('panah hanya di tampilan langkah yang lebih baik', () => {
    expect(moveArrows(m, 'played')).toEqual([]);
    expect(moveArrows(m, 'better')).toEqual([{ startSquare: 'd2', endSquare: 'd4', color: '#22a559' }]);
  });
});
 
describe('main lawan engine', () => {
  it('langkah legal diterima dan ilegal ditolak', () => {
    const start = replay([]).fen;
    expect(applyMove(start, 'e2', 'e4')).toMatchObject({ legal: true, san: 'e4', uci: 'e2e4' });
    expect(applyMove(start, 'e2', 'e5').legal).toBe(false);
    expect(applyUci(start, 'g1f3').san).toBe('Nf3');
  });
  it('promosi pion otomatis menjadi ratu', () => {
    const r = applyMove('8/P6k/8/8/8/8/8/K7 w - - 0 1', 'a7', 'a8');
    expect(r.legal).toBe(true);
    expect(r.uci).toBe('a7a8q');
  });
  it('replay mendeteksi skakmat, stalemate, dan game yang masih jalan', () => {
    expect(replay(['f3', 'e5', 'g4', 'Qh4#']).status).toMatchObject({ over: true, result: '0-1' });
    expect(replay(['e4', 'e5']).status.over).toBe(false);
    expect(replay(['e4', 'e5']).turn).toBe('w');
    expect(replay(['e4']).last).toEqual({ from: 'e2', to: 'e4' });
    const stalemate = ['e3', 'a5', 'Qh5', 'Ra6', 'Qxa5', 'h5', 'h4', 'Rah6', 'Qxc7', 'f6', 'Qxd7+', 'Kf7', 'Qxb7', 'Qd3', 'Qxb8', 'Qh7', 'Qxc8', 'Kg6', 'Qe6'];
    expect(replay(stalemate).status).toMatchObject({ over: true, result: '1/2-1/2' });
  });
  it('PGN dari buildPgn bisa dibaca kembali oleh parsePgn', () => {
    const sans = ['e4', 'e5', 'Nf3', 'Nc6'];
    const pgn = buildPgn(sans, { white: 'Kamu', black: 'Stockfish Mudah', result: '*' });
    const g = parsePgn(pgn);
    expect(g.moves.map((x) => x.san)).toEqual(sans);
    expect(g.headers.White).toBe('Kamu');
  });
  it('tingkat kesulitan valid dan menyerah memberi hasil benar', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    for (const l of LEVELS) {
      expect(l.skill).toBeGreaterThanOrEqual(0);
      expect(l.skill).toBeLessThanOrEqual(20);
      expect(l.depth).toBeGreaterThan(0);
    }
    expect(resignResult('white')).toBe('0-1');
    expect(resignResult('black')).toBe('1-0');
  });
});
