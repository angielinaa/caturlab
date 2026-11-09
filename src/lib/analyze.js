import { Chess } from 'chess.js';
import { MATE_CP, scoreToCp } from './analysis.js';
 
// Menganalisis semua posisi satu per satu.
// `evaluate(fen, depth, multipv)` adalah fungsi dari engine (Stockfish) yang mengembalikan
// { cp, mate, bestUci, pv, second }, dengan skor dari sudut pandang pihak yang jalan.
// `second` = skor langkah terbaik kedua (atau null), dipakai untuk label "Sangat baik".
// Hasil: array evaluasi dari sudut pandang PUTIH, satu untuk tiap posisi.
export async function analyzeGame(positions, evaluate, options = {}) {
  const { depth = 12, onProgress, shouldCancel } = options;
  const results = [];
  for (let i = 0; i < positions.length; i++) {
    if (shouldCancel?.()) throw new Error('CANCELLED');
    const fen = positions[i];
    const chess = new Chess(fen);
    const whiteToMove = chess.turn() === 'w';
    const sign = whiteToMove ? 1 : -1;
    let whiteCp;
    let bestUci = null;
    let pv = [];
    let secondWhiteCp = null;
    if (chess.isCheckmate()) {
      whiteCp = whiteToMove ? -MATE_CP : MATE_CP; // pihak yang jalan sudah kalah
    } else if (chess.isDraw() || chess.isStalemate()) {
      whiteCp = 0;
    } else {
      const res = await evaluate(fen, depth, 2);
      whiteCp = sign * scoreToCp(res);
      bestUci = res.bestUci;
      pv = res.pv ?? [];
      if (res.second) secondWhiteCp = sign * scoreToCp(res.second);
    }
    results.push({ whiteCp, bestUci, pv, secondWhiteCp });
    onProgress?.(i + 1, positions.length);
  }
  return results;
}
