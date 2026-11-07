import { cpToWinPercent } from '../lib/analysis.js';
 
const W = 400;
const H = 100;
 
// Grafik evaluasi: makin tinggi garisnya, makin menguntungkan putih. Klik untuk loncat ke posisi.
export default function EvalGraph({ evals, index, onSelect }) {
  const n = evals.length - 1;
  const x = (i) => (n === 0 ? 0 : (i / n) * W);
  const y = (cp) => H - (cpToWinPercent(cp) / 100) * H;
  const points = evals.map((cp, i) => `${x(i).toFixed(1)},${y(cp).toFixed(1)}`);
  const area = `0,${H} ${points.join(' ')} ${W},${H}`;
 
  function handleClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onSelect(Math.max(0, Math.min(n, Math.round(ratio * n))));
  }
 
  return (
    <svg
      className="eval-graph"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      onClick={handleClick}
      role="img"
      aria-label="Grafik evaluasi game"
    >
      <rect width={W} height={H} className="eg-bg" />
      <polygon points={area} className="eg-area" />
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="eg-mid" />
      <polyline points={points.join(' ')} className="eg-line" />
      <line x1={x(index)} x2={x(index)} y1="0" y2={H} className="eg-cursor" />
    </svg>
  );
}
