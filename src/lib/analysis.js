// Rumus evaluasi: dari skor engine menjadi klasifikasi langkah dan akurasi.
export const MATE_CP = 10000;
 
export const CLASS_ORDER = ['great', 'best', 'good', 'inaccuracy', 'mistake', 'miss', 'blunder'];
 
export const CLASS_INFO = {
  great: { label: 'Sangat baik', color: '#1a9e9e' },
  best: { label: 'Terbaik', color: '#22a559' },
  good: { label: 'Bagus', color: '#6aa84f' },
  inaccuracy: { label: 'Kurang akurat', color: '#e0a100' },
  mistake: { label: 'Kesalahan', color: '#e46a1f' },
  miss: { label: 'Peluang terlewat', color: '#8a63c7' },
  blunder: { label: 'Blunder', color: '#d32f2f' },
};
 
// Ambang tambahan (heuristik, boleh kamu ubah).
export const GREAT_GAP = 15; // langkah terbaik unggul >= 15 poin % dari langkah terbaik kedua
export const GREAT_MAX_WIN = 90; // jangan beri "sangat baik" jika posisi sudah menang telak
export const MISS_PREV_LOSS = 10; // lawan baru kehilangan >= 10 poin % di langkah sebelumnya
 
// Skor engine -> centipawan (cp). Skakmat dianggap +/- 10000.
export function scoreToCp({ cp, mate }) {
  if (mate !== null && mate !== undefined) return mate > 0 ? MATE_CP : -MATE_CP;
  return cp ?? 0;
}
 
// Centipawan -> peluang menang 0..100 (kurva logistik yang dipakai Lichess).
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
 
// Menyempurnakan klasifikasi dasar dengan dua label tambahan:
// - great: langkah terbaik yang jauh lebih baik daripada alternatif terbaik kedua.
// - miss: langkah kurang akurat/kesalahan tepat setelah lawan salah, atau saat kamu punya jalan skakmat.
export function refineClass(base, { isBest, winBefore, winSecond, prevLoss, hadMate }) {
  const hasSecond = winSecond !== null && winSecond !== undefined;
  if (base === 'best' && isBest && hasSecond && winBefore < GREAT_MAX_WIN && winBefore - winSecond >= GREAT_GAP) {
    return 'great';
  }
  if ((base === 'inaccuracy' || base === 'mistake') && (prevLoss >= MISS_PREV_LOSS || hadMate)) {
    return 'miss';
  }
  return base;
}
 
// Akurasi per langkah 0..100 (rumus pendekatan Lichess).
export function moveAccuracy(loss) {
  const a = 103.1668 * Math.exp(-0.04354 * loss) - 3.1669;
  return Math.max(0, Math.min(100, a));
}