import { Chess } from 'chess.js';
import { MATE_CP, scoreToCp } from './analysis.js';
 
// Menganalisis semua posisi satu per satu.
// `evaluate(fen, depth)` adalah fungsi dari engine (Stockfish) yang mengembalikan
// { cp, mate, bestUci }, dengan skor dari sudut pandang pihak yang jalan.
// Hasil: array evaluasi dari sudut pandang PUTIH, satu untuk tiap posisi.
export async function analyzeGame(positions, evaluate, options = {}) {
  const { depth = 12, onProgress, shouldCancel } = options;
  const results = [];
 
  for (let i = 0; i < positions.length; i++) {
    if (shouldCancel?.()) throw new Error('CANCELLED');
    const fen = positions[i];
    const chess = new Chess(fen);
    const whiteToMove = chess.turn() === 'w';
 
    let whiteCp;
    let bestUci = null;
    if (chess.isCheckmate()) {
      whiteCp = whiteToMove ? -MATE_CP : MATE_CP; // pihak yang jalan sudah kalah
    } else if (chess.isDraw() || chess.isStalemate()) {
      whiteCp = 0;
    } else {
      const res = await evaluate(fen, depth);
      const sideCp = scoreToCp(res);
      whiteCp = whiteToMove ? sideCp : -sideCp;
      bestUci = res.bestUci;
    }
 
    results.push({ whiteCp, bestUci });
    onProgress?.(i + 1, positions.length);
  }
  return results;
}
