import { Chess } from 'chess.js';
 
// Memeriksa langkah pengguna pada sebuah puzzle.
// Puzzle bertipe 'mate1' benar jika langkahnya skakmat; selain itu harus ada di `solutions`.
export function checkPuzzleMove(puzzle, from, to) {
  const chess = new Chess(puzzle.fen);
  const piece = chess.get(from);
  const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
 
  let move;
  try {
    move = chess.move({ from, to, promotion: isPromotion ? 'q' : undefined });
  } catch {
    return { legal: false, correct: false };
  }
 
  const uci = move.from + move.to + (move.promotion ?? '');
  const correct = puzzle.type === 'mate1' ? chess.isCheckmate() : puzzle.solutions.includes(uci);
  return { legal: true, correct, fenAfter: chess.fen(), san: move.san };
}
