import { LESSONS, QUICK_TIPS } from '../data/lessons.js';
import { PHASES, PHASE_LABELS, errorScore, recommend } from '../lib/weakness.js';
 
export default function TipsPage({ profile, onOpenLesson, onReset }) {
  const rec = recommend(profile);
  const maxScore = Math.max(0.01, ...PHASES.map((p) => errorScore(profile.phases[p])));
 
  return (
    <div className="tips">
      <section className="card">
        <h2>Profil kelemahanmu</h2>
        {profile.games === 0 ? (
          <p className="muted">Belum ada data. Analisis satu game di tab Review dulu.</p>
        ) : (
          <>
            <p className="muted">Dari {profile.games} game yang kamu review.</p>
            {PHASES.map((p) => {
              const ph = profile.phases[p];
              const score = errorScore(ph);
              return (
                <div className="bar-row" key={p}>
                  <span className="bar-label">{PHASE_LABELS[p]}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(score / maxScore) * 100}%` }} />
                  </div>
                  <span className="bar-num">
                    {ph.blunder} blunder / {ph.moves} langkah
                  </span>
                </div>
              );
            })}
            {rec && (
              <div className="reco">
                <p>
                  Fokus latihan: <strong>{PHASE_LABELS[rec.weakestPhase]}</strong>
                </p>
                {rec.lessons.map((id) => {
                  const lesson = LESSONS.find((l) => l.id === id);
                  return (
                    lesson && (
                      <button type="button" key={id} onClick={() => onOpenLesson(id)}>
                        Buka: {lesson.title}
                      </button>
                    )
                  );
                })}
              </div>
            )}
            <button type="button" className="ghost" onClick={onReset}>
              Reset profil
            </button>
          </>
        )}
      </section>
 
      <section className="card">
        <h2>Tips cepat naik level</h2>
        <ol>
          {QUICK_TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
