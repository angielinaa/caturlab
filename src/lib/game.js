import { Chess } from 'chess.js';
 
// PGN -> daftar langkah + daftar posisi (FEN) sebelum/sesudah tiap langkah.
export function parsePgn(pgn) {
  const chess = new Chess();
  chess.loadPgn(pgn.trim()); // melempar error jika PGN tidak valid
  const history = chess.history({ verbose: true });
  if (history.length === 0) throw new Error('PGN tidak berisi langkah.');
 
  const moves = history.map((m, i) => ({
    ply: i + 1,
    moveNumber: Number(m.before.split(' ')[5]) || Math.floor(i / 2) + 1,
    color: m.color, // 'w' atau 'b'
    san: m.san,
    uci: m.from + m.to + (m.promotion ?? ''),
    fenBefore: m.before,
    fenAfter: m.after,
  }));
 
  return {
    headers: chess.getHeaders(),
    moves,
    positions: [moves[0].fenBefore, ...moves.map((m) => m.fenAfter)],
  };
}
 
// 'e2e4' pada posisi tertentu -> 'e4' (notasi yang enak dibaca).
export function uciToSan(fen, uci) {
  try {
    const chess = new Chess(fen);
    return chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
  } catch {
    return uci;
  }
}
