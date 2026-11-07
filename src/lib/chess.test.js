import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { parseInfoLine, parseBestMove } from './uci.js';
import { classifyLoss, cpToWinPercent, moveAccuracy, scoreToCp, MATE_CP } from './analysis.js';
import { parsePgn, uciToSan } from './game.js';
import { analyzeGame } from './analyze.js';
import { buildReview } from './review.js';
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
    expect(parseInfoLine('info depth 5 multipv 2 score cp 10 pv a1a8')).toBeNull();
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
