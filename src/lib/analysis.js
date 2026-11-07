// Rumus evaluasi: dari skor engine menjadi klasifikasi langkah dan akurasi.
 
export const MATE_CP = 10000;
 
export const CLASS_ORDER = ['best', 'good', 'inaccuracy', 'mistake', 'blunder'];
 
export const CLASS_INFO = {
  best: { label: 'Terbaik', color: '#22a559' },
  good: { label: 'Bagus', color: '#6aa84f' },
  inaccuracy: { label: 'Kurang akurat', color: '#e0a100' },
  mistake: { label: 'Kesalahan', color: '#e46a1f' },
  blunder: { label: 'Blunder', color: '#d32f2f' },
};
 
// Skor engine -> centipawn (cp). Skakmat dianggap +/- 10000.
export function scoreToCp({ cp, mate }) {
  if (mate !== null && mate !== undefined) return mate > 0 ? MATE_CP : -MATE_CP;
  return cp ?? 0;
}
 
// Centipawn -> peluang menang 0..100 (kurva logistik yang dipakai Lichess).
export function cpToWinPercent(cp) {
  const c = Math.max(-MATE_CP, Math.min(MATE_CP, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}
 
// loss = peluang menang yang hilang (poin persen) karena langkah itu.
// Ambang di bawah adalah heuristik: boleh kamu ubah sesuai selera.
export function classifyLoss(loss, isBest) {
  if (isBest || loss <= 1) return 'best';
  if (loss <= 5) return 'good';
  if (loss <= 10) return 'inaccuracy';
  if (loss <= 20) return 'mistake';
  return 'blunder';
}
 
// Akurasi per langkah 0..100 (rumus pendekatan Lichess).
export function moveAccuracy(loss) {
  const a = 103.1668 * Math.exp(-0.04354 * loss) - 3.1669;
  return Math.max(0, Math.min(100, a));
}
