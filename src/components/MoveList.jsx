import { CLASS_INFO } from '../lib/analysis.js';
 
// Daftar langkah berpasangan (putih, hitam). Titik warna = kualitas langkah.
export default function MoveList({ moves, index, onSelect }) {
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) rows.push([moves[i], moves[i + 1]]);
 
  const cell = (m) =>
    m && (
      <button
        type="button"
        className={`move${index === m.ply ? ' active' : ''}`}
        onClick={() => onSelect(m.ply)}
      >
        <span className="dot" style={{ background: CLASS_INFO[m.cls].color }} />
        {m.san}
      </button>
    );
 
  return (
    <div className="move-list">
      {rows.map(([w, b]) => (
        <div className="move-row" key={w.ply}>
          <span className="move-no">{w.moveNumber}.</span>
          {cell(w)}
          {cell(b)}
        </div>
      ))}
    </div>
  );
}
