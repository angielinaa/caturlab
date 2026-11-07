import { CLASS_INFO, CLASS_ORDER } from '../lib/analysis.js';
 
function Side({ title, data }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="accuracy">{data.accuracy.toFixed(1)}%</div>
      <div className="muted">akurasi</div>
      <ul className="counts">
        {CLASS_ORDER.map((c) => (
          <li key={c}>
            <span className="dot" style={{ background: CLASS_INFO[c].color }} />
            {CLASS_INFO[c].label}
            <strong>{data.counts[c]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
 
export default function SummaryCards({ summary }) {
  return (
    <div className="summary">
      <Side title="Putih" data={summary.w} />
      <Side title="Hitam" data={summary.b} />
    </div>
  );
}
