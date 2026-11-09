import { Chess } from 'chess.js';
 
// Logika main lawan engine. Fungsi murni, mudah dites.
export const START_FEN = new Chess().fen();
 
// Tingkat kesulitan: skill = opsi "Skill Level" Stockfish (0-20), depth = kedalaman pencarian.
// Angkanya perkiraan kasar, bukan rating resmi. Ubah sesuai seleramu.
export const LEVELS = [
  { id: 'pemula', label: 'Pemula', skill: 0, depth: 1 },
  { id: 'mudah', label: 'Mudah', skill: 4, depth: 4 },
  { id: 'menengah', label: 'Menengah', skill: 9, depth: 7 },
  { id: 'mahir', label: 'Mahir', skill: 15, depth: 11 },
  { id: 'kuat', label: 'Kuat', skill: 20, depth: 14 },
];
 
// Mencoba sebuah langkah di posisi `fen`. Promosi pion otomatis menjadi ratu.
export function applyMove(fen, from, to, promotion) {
  const chess = new Chess(fen);
  const piece = chess.get(from);
  const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
  try {
    const m = chess.move({ from, to, promotion: promotion ?? (isPromotion ? 'q' : undefined) });
    return { legal: true, fen: chess.fen(), san: m.san, uci: m.from + m.to + (m.promotion ?? '') };
  } catch {
    return { legal: false };
  }
}
 
// Langkah dari engine (format UCI, mis. 'e2e4' atau 'e7e8q').
export function applyUci(fen, uci) {
  return applyMove(fen, uci.slice(0, 2), uci.slice(2, 4), uci[4]);
}
 
function statusOf(chess) {
  if (chess.isCheckmate()) {
    const whiteWon = chess.turn() === 'b';
    return { over: true, result: whiteWon ? '1-0' : '0-1', text: `Skakmat! ${whiteWon ? 'Putih' : 'Hitam'} menang.` };
  }
  if (chess.isStalemate()) return { over: true, result: '1/2-1/2', text: 'Remis: stalemate (tidak ada langkah legal).' };
  if (chess.isInsufficientMaterial()) return { over: true, result: '1/2-1/2', text: 'Remis: bidak tersisa tidak cukup untuk skakmat.' };
  if (chess.isThreefoldRepetition()) return { over: true, result: '1/2-1/2', text: 'Remis: posisi yang sama muncul tiga kali.' };
  if (chess.isDraw()) return { over: true, result: '1/2-1/2', text: 'Remis: aturan 50 langkah.' };
  return { over: false, result: '*', text: '' };
}
 
// Memutar ulang daftar langkah (notasi SAN) dari posisi awal.
// Hasil: posisi sekarang, giliran siapa, langkah terakhir, dan status game.
export function replay(sans) {
  const chess = new Chess();
  let last = null;
  for (const san of sans) {
    const m = chess.move(san);
    last = { from: m.from, to: m.to };
  }
  return { fen: chess.fen(), turn: chess.turn(), last, status: statusOf(chess) };
}
 
// Hasil jika pemain menyerah.
export const resignResult = (playerColor) => (playerColor === 'white' ? '0-1' : '1-0');
 
// Membuat teks PGN dari daftar langkah, siap dikirim ke halaman Review.
export function buildPgn(sans, { white, black, result = '*' }) {
  const chess = new Chess();
  for (const san of sans) chess.move(san);
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
  chess.setHeader('Event', 'CaturLab');
  chess.setHeader('Site', 'CaturLab');
  chess.setHeader('Date', date);
  chess.setHeader('White', white);
  chess.setHeader('Black', black);
  chess.setHeader('Result', result);
  return chess.pgn();
}
