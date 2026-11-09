import { CLASS_INFO } from './analysis.js';
 
const GOOD = '#22a559';
 
// Mewarnai satu petak: bayangan "inset" besar menimpa warna petak tanpa menutupi bidak.
// `alpha` = dua digit hex transparansi (mis. '66' = sekitar 40%).
const tint = (color, alpha) => ({ boxShadow: `inset 0 0 0 100px ${color}${alpha}` });
 
// Petak yang disorot di papan.
// view 'played': petak asal dan tujuan langkahmu, warnanya sesuai kualitas langkah.
// view 'better': petak asal (samar) dan tujuan (tegas) langkah yang lebih baik, warna hijau.
export function squareHighlights(m, view = 'played') {
  if (!m) return {};
  if (view === 'better' && m.bestUci) {
    return {
      [m.bestUci.slice(0, 2)]: tint(GOOD, '55'),
      [m.bestUci.slice(2, 4)]: tint(GOOD, 'aa'),
    };
  }
  const color = CLASS_INFO[m.cls].color;
  return {
    [m.uci.slice(0, 2)]: tint(color, '44'),
    [m.uci.slice(2, 4)]: tint(color, '88'),
  };
}
 
// Panah hanya ditampilkan di tampilan "langkah yang lebih baik".
export function moveArrows(m, view = 'played') {
  if (view !== 'better' || !m?.bestUci) return [];
  return [{ startSquare: m.bestUci.slice(0, 2), endSquare: m.bestUci.slice(2, 4), color: GOOD }];
}

// Sorotan saat sebuah bidakmu dipilih: petak bidak itu (kuning), titik di petak kosong yang bisa
// dituju, dan cincin merah di petak yang berisi bidak lawan yang bisa dimakan.
export function selectionStyles(selected, targets) {
  if (!selected) return {};
  const styles = { [selected]: tint('#f5c842', 'aa') };
  for (const t of targets) {
    styles[t.to] = {
      backgroundImage: t.capture
        ? 'radial-gradient(circle, transparent 58%, rgba(211, 47, 47, 0.7) 60%)'
        : 'radial-gradient(circle, rgba(0, 0, 0, 0.3) 22%, transparent 24%)',
    };
  }
  return styles;
}

// Menggabungkan beberapa peta gaya petak. Gaya di petak yang sama digabung, bukan saling menimpa.
export function mergeStyles(...maps) {
  const out = {};
  for (const map of maps) {
    for (const [square, style] of Object.entries(map)) out[square] = { ...out[square], ...style };
  }
  return out;
}