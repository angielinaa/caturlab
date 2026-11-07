import { MATE_CP } from './analysis.js';
 
// Penjelasan berbasis aturan (tanpa AI). Nanti bisa ditambah penjelasan dari LLM.
export function explainMove(m) {
  if (!m) return 'Pilih sebuah langkah di daftar untuk melihat penjelasannya.';
  const loss = Math.round(m.loss);
  const better = m.bestSan ? ` Langkah yang lebih kuat: ${m.bestSan}.` : '';
 
  const hadMate = m.moverCpBefore >= MATE_CP - 1;
  const gotMated = m.moverCpAfter <= -(MATE_CP - 1);
  if (gotMated) return `${m.san} membuka jalan skakmat bagi lawan.${better}`;
  if (hadMate && m.cls !== 'best') return `Kamu punya jalan menuju skakmat, tapi ${m.san} melewatkannya.${better}`;
 
  switch (m.cls) {
    case 'best':
      return `${m.san} adalah langkah terbaik atau setara dengan terbaik. Pertahankan!`;
    case 'good':
      return `${m.san} langkah yang bagus. Selisihnya dengan yang terbaik kecil (sekitar ${loss}% peluang menang).${better}`;
    case 'inaccuracy':
      return `${m.san} kurang akurat: kamu kehilangan sekitar ${loss}% peluang menang.${better}`;
    case 'mistake':
      return `${m.san} sebuah kesalahan: sekitar ${loss}% peluang menang hilang.${better}`;
    default:
      return `${m.san} adalah blunder: sekitar ${loss}% peluang menang hilang.${better}`;
  }
}
 
// Tips singkat yang muncul sesuai jenis kesalahan.
export function tipForClass(cls) {
  if (cls === 'blunder') return 'Sebelum melangkah, biasakan cek CCT: Check, Capture, Threat milik lawan.';
  if (cls === 'mistake') return 'Tanya dirimu: apa yang dimaui lawan setelah langkahku? Cari ancamannya dulu.';
  if (cls === 'inaccuracy') return 'Bandingkan 2-3 kandidat langkah, jangan langsung ambil yang pertama terpikir.';
  return '';
}
