import Board from '../components/Board.jsx';
import { LESSONS } from '../data/lessons.js';
 
export default function LearnPage({ lessonId, onSelect }) {
  const lesson = LESSONS.find((l) => l.id === lessonId) ?? LESSONS[0];
  const arrows = lesson.arrow
    ? [{ startSquare: lesson.arrow[0], endSquare: lesson.arrow[1], color: '#22a559' }]
    : [];
 
  return (
    <div className="learn-layout">
      <nav className="card lesson-list" aria-label="Daftar materi">
        {LESSONS.map((l) => (
          <button
            type="button"
            key={l.id}
            className={`lesson-btn${l.id === lesson.id ? ' active' : ''}`}
            onClick={() => onSelect(l.id)}
          >
            <strong>{l.title}</strong>
            <span className="muted">{l.level}</span>
          </button>
        ))}
      </nav>
 
      <article className="card lesson">
        <h2>{lesson.title}</h2>
        <p className="muted">{lesson.summary}</p>
        {lesson.fen && (
          <figure>
            <Board id={`lesson-${lesson.id}`} fen={lesson.fen} arrows={arrows} />
            <figcaption className="muted">{lesson.caption}</figcaption>
          </figure>
        )}
        {lesson.sections.map((s) => (
          <section key={s.h}>
            <h3>{s.h}</h3>
            {s.p.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </section>
        ))}
        <h3>Checklist</h3>
        <ul>
          {lesson.checklist.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
