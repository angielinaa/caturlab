import { Chess } from 'chess.js';
 
// Pola taktik sederhana untuk penjelasan langkah. Hanya memakai aturan catur dari chess.js,
// tanpa AI. Mengembalikan objek data (kind, bidak, petak); kalimatnya dibuat di explain.js.
export const PIECE_NAME = { p: 'pion', n: 'kuda', b: 'gajah', r: 'benteng', q: 'ratu', k: 'raja' };
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
 
function tryMove(fen, uci) {
  const chess = new Chess(fen);
  try {
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return { chess, move };
  } catch {
    return null;
  }
}

// Bidak apa yang melangkah dari mana ke mana (dan apa yang dimakan). null jika langkah ilegal.
export function moveParts(fen, uci) {
  const r = tryMove(fen, uci);
  if (!r) return null;
  return { piece: r.move.piece, from: r.move.from, to: r.move.to, captured: r.move.captured ?? null };
}

// Posisi (FEN) setelah sebuah langkah UCI dimainkan. null jika langkah tidak legal.
export function fenAfterMove(fen, uci) {
  return tryMove(fen, uci)?.chess.fen() ?? null;
}
 
// Ancaman terbesar lawan setelah balasannya: bidakmu yang bisa dimakan dengan untung material.
// Giliran dibalik sebentar supaya kita bisa melihat langkah tangkap milik lawan.
function biggestThreat(chess) {
  const parts = chess.fen().split(' ');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  parts[3] = '-';
  let flipped;
  try {
    flipped = new Chess(parts.join(' '));
  } catch {
    return null;
  }
  let best = null;
  for (const mv of flipped.moves({ verbose: true })) {
    if (!mv.captured || mv.captured === 'k') continue;
    const after = new Chess(flipped.fen());
    after.move(mv);
    const defended = after.moves({ verbose: true }).some((x) => x.to === mv.to && x.captured);
    const gain = VALUE[mv.captured] - (defended ? VALUE[mv.piece] : 0);
    if (gain > 0 && (!best || gain > best.gain)) best = { piece: mv.captured, square: mv.to, gain };
  }
  return best;
}
 
// Kenapa langkah itu buruk? Kita lihat balasan terbaik lawan (replyUci) setelah langkahmu.
export function describeProblem({ fenAfter, uci, replyUci, gotMated }) {
  if (!replyUci) return gotMated ? { kind: 'mateThreat', replySan: null } : null;
  const r = tryMove(fenAfter, replyUci);
  if (!r) return null;
  const { chess, move } = r;
  const base = { replySan: move.san, reply: { piece: move.piece, from: move.from, to: move.to } };
  if (chess.isCheckmate()) return { kind: 'mate', ...base };
  if (gotMated) return { kind: 'mateThreat', ...base };
  if (move.captured) {
    // Setelah lawan menangkap, adakah langkah legalmu yang menangkap balik di petak yang sama?
    const canRecapture = chess.moves({ verbose: true }).some((x) => x.to === move.to && x.captured);
    const info = { ...base, piece: move.captured, square: move.to, movedPiece: move.to === uci.slice(2, 4) };
    if (!canRecapture) return { kind: 'hanging', ...info };
    if (VALUE[move.captured] > VALUE[move.piece]) return { kind: 'badTrade', ...info, attacker: move.piece };
    return { kind: 'trade', ...info };
  }
  if (chess.inCheck()) return { kind: 'check', ...base };
  const threat = biggestThreat(chess);
  if (threat) return { kind: 'threat', ...base, piece: threat.piece, square: threat.square };
  return { kind: 'other', ...base };
}
 
// Kenapa langkah terbaik (bestUci) lebih baik? Dilihat dari sifat langkahnya.
export function describeBetter({ fenBefore, bestUci, hadMate }) {
  const r = tryMove(fenBefore, bestUci);
  if (!r) return null;
  const { chess, move } = r;
  const base = { san: move.san, from: move.from, to: move.to, piece: move.piece };
  if (chess.isCheckmate()) return { kind: 'mate', ...base };
  if (hadMate) return { kind: 'matePlan', ...base };
  if (move.captured) {
    // Sekarang giliran lawan: bisakah ia menangkap balik bidak yang baru kamu pindahkan?
    const safe = !chess.moves({ verbose: true }).some((x) => x.to === move.to && x.captured);
    return { kind: 'capture', ...base, captured: move.captured, safe };
  }
  if (chess.inCheck()) return { kind: 'check', ...base };
  const before = new Chess(fenBefore);
  const opponent = move.color === 'w' ? 'b' : 'w';
  if (move.piece !== 'k' && before.isAttacked(move.from, opponent)) return { kind: 'rescue', ...base };
  if (move.san.startsWith('O-O')) return { kind: 'castle', ...base };
  return { kind: 'quiet', ...base };
}