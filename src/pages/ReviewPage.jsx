import { useEffect, useRef, useState } from 'react';
import Board from '../components/Board.jsx';
import EvalGraph from '../components/EvalGraph.jsx';
import MoveList from '../components/MoveList.jsx';
import SummaryCards from '../components/SummaryCards.jsx';
import { SAMPLE_PGN } from '../data/samples.js';
import { analyzeGame } from '../lib/analyze.js';
import { CLASS_INFO } from '../lib/analysis.js';
import { explainBetter, explainMove, tipForClass } from '../lib/explain.js';
import { parsePgn } from '../lib/game.js';
import { moveArrows, squareHighlights } from '../lib/highlight.js';
import { buildReview, findNextIssue, keyMoments } from '../lib/review.js';
import { profileFromReview } from '../lib/weakness.js';
import { PIECE_NAME } from '../lib/tactics.js';
 
const REPLAY_INTERVAL_MS = 1200; // jeda antar langkah saat replay otomatis
 
// Contoh: "9... Pion b7→b5 (b5)". Menyebut bidaknya, bukan hanya petaknya.
const moveLabel = (m) => {
  const piece = m.piece ? `${PIECE_NAME[m.piece][0].toUpperCase()}${PIECE_NAME[m.piece].slice(1)} ${m.from}→${m.to} (${m.san})` : m.san;
  return `${m.moveNumber}${m.color === 'w' ? '.' : '...'} ${piece}`;
};
 
// incoming: game yang baru selesai dimainkan ({ key, pgn, color }), langsung dianalisis otomatis.
// initialGame: game terakhir dari penyimpanan, hanya untuk mengisi kotak PGN saat halaman dibuka.
// active: halaman sedang tampil. Papan hanya dipasang saat tampil (tidak bisa dipasang di elemen tersembunyi).
export default function ReviewPage({ getEngine, onProfileUpdate, incoming, initialGame, active = true }) {
  const [pgn, setPgn] = useState(initialGame?.pgn ?? SAMPLE_PGN);
  const [color, setColor] = useState(initialGame?.color ?? 'white');
  const [depth, setDepth] = useState(12);
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [game, setGame] = useState(null);
  const [review, setReview] = useState(null);
  const [index, setIndex] = useState(0); // 0 = posisi awal, n = setelah langkah ke-n
  const [view, setView] = useState('played'); // 'played' = langkahmu, 'better' = langkah yang lebih baik
  const [playing, setPlaying] = useState(false); // replay otomatis
  const cancelRef = useRef(false);
  const handledKey = useRef(null);
 
  async function runAnalysis(pgnText, playerColor) {
    setError('');
    let parsed;
    try {
      parsed = parsePgn(pgnText);
    } catch (e) {
      setError(`PGN tidak valid: ${e.message}`);
      return;
    }
    cancelRef.current = false;
    setGame(parsed);
    setReview(null);
    setIndex(0);
    setView('played');
    setPlaying(false);
    setStatus('running');
    setProgress({ done: 0, total: parsed.positions.length });
    try {
      const engine = getEngine();
      const evals = await analyzeGame(parsed.positions, (fen, d, multipv) => engine.evaluate(fen, d, multipv), {
        depth,
        onProgress: (done, total) => setProgress({ done, total }),
        shouldCancel: () => cancelRef.current,
      });
      const result = buildReview(parsed.moves, evals);
      setReview(result);
      setStatus('done');
      onProfileUpdate(profileFromReview(result.moves, playerColor));
    } catch (e) {
      if (e.message === 'CANCELLED') {
        setStatus('idle');
      } else {
        setError(`Analisis gagal: ${e.message}`);
        setStatus('error');
      }
    }
  }
 
  // Game yang baru selesai dimainkan: isi kotak PGN lalu langsung analisis.
  useEffect(() => {
    if (!incoming || handledKey.current === incoming.key) return;
    handledKey.current = incoming.key;
    setPgn(incoming.pgn);
    setColor(incoming.color);
    runAnalysis(incoming.pgn, incoming.color);
  }, [incoming]); // eslint-disable-line
 
  const maxIndex = review ? review.moves.length : 0;
 
  // Pindah ke posisi ke-i. Selalu kembali ke tampilan "langkahmu".
  function goTo(i) {
    setIndex(Math.max(0, Math.min(maxIndex, i)));
    setView('played');
  }
 
  // Replay otomatis: maju satu langkah tiap interval, berhenti di akhir.
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => setIndex((i) => Math.min(maxIndex, i + 1)), REPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, maxIndex]);
  useEffect(() => {
    if (playing && index >= maxIndex) setPlaying(false);
  }, [playing, index, maxIndex]);
 
  // Navigasi dengan tombol panah kiri/kanan.
  useEffect(() => {
    if (!review) return undefined;
    const onKey = (e) => {
      if (e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') goTo(index - 1);
      if (e.key === 'ArrowRight') goTo(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // dipasang ulang tiap render supaya selalu memakai index terbaru
 
  const side = color === 'white' ? 'w' : 'b';
  const current = review && index > 0 ? review.moves[index - 1] : null;
  const betterText = explainBetter(current);
  const showBetter = view === 'better' && Boolean(current?.fenIfBest);
  const shown = showBetter ? 'better' : 'played';
  const fen = showBetter ? current.fenIfBest : game ? game.positions[index] : 'start';
  const nextIssue = review ? findNextIssue(review.moves, index, side) : null;
  const moments = review ? keyMoments(review.moves, side) : [];
 
  return (
    <div className="review">
      <section className="card">
        <label htmlFor="pgn">Tempel PGN game-mu (dari Lichess, chess.com, atau game yang baru kamu mainkan)</label>
        <textarea id="pgn" rows={6} value={pgn} onChange={(e) => setPgn(e.target.value)} />
        <div className="controls">
          <label>
            Aku main sebagai
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="white">Putih</option>
              <option value="black">Hitam</option>
            </select>
          </label>
          <label>
            Kedalaman analisis
            <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
              <option value={10}>10 (cepat)</option>
              <option value={12}>12 (seimbang)</option>
              <option value={14}>14 (teliti)</option>
            </select>
          </label>
          {status === 'running' ? (
            <button type="button" onClick={() => (cancelRef.current = true)}>
              Batalkan
            </button>
          ) : (
            <button type="button" onClick={() => runAnalysis(pgn, color)}>
              Analisis game
            </button>
          )}
        </div>
        {status === 'running' && (
          <progress value={progress.done} max={progress.total}>
            {progress.done}/{progress.total}
          </progress>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
 
      {game && (
        <div className="review-layout">
          <div>
            {active && (
              <Board
                id="review-board"
                fen={fen}
                orientation={color}
                arrows={moveArrows(current, shown)}
                squareStyles={squareHighlights(current, shown)}
              />
            )}
            <div className="nav">
              <button type="button" onClick={() => goTo(0)} disabled={index === 0} aria-label="Ke awal">
                «
              </button>
              <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Langkah sebelumnya">
                ‹
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!playing && index >= maxIndex) goTo(0);
                  setView('played');
                  setPlaying(!playing);
                }}
                disabled={!review}
              >
                {playing ? 'Jeda' : 'Putar ulang'}
              </button>
              <button type="button" onClick={() => goTo(index + 1)} disabled={index === maxIndex} aria-label="Langkah berikutnya">
                ›
              </button>
              <button type="button" onClick={() => goTo(maxIndex)} disabled={index === maxIndex} aria-label="Ke akhir">
                »
              </button>
              <span className="muted">
                {index} / {game.moves.length}
              </span>
            </div>
            {review && (
              <div className="nav">
                <button type="button" onClick={() => goTo(nextIssue)} disabled={nextIssue === null}>
                  Kesalahanku berikutnya
                </button>
              </div>
            )}
          </div>
          <div className="side-panel">
            {review ? (
              <>
                <div className="card">
                  <EvalGraph evals={review.evals} index={index} onSelect={goTo} />
                  {current && (
                    <p className="move-title">
                      <span className="dot" style={{ background: CLASS_INFO[current.cls].color }} />
                      {moveLabel(current)} · {CLASS_INFO[current.cls].label}
                    </p>
                  )}
                  <p className="explain">{explainMove(current)}</p>
                  {betterText && (
                    <div className="better">
                      <p>{betterText}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setPlaying(false);
                          setView(showBetter ? 'played' : 'better');
                        }}
                      >
                        {showBetter ? 'Kembali ke langkahmu' : 'Tampilkan di papan'}
                      </button>
                    </div>
                  )}
                  {current && tipForClass(current.cls) && <p className="tip">{tipForClass(current.cls)}</p>}
                </div>
                {moments.length > 0 && (
                  <div className="card">
                    <h3>Momen paling merugikan</h3>
                    <ul className="moments">
                      {moments.map((m) => (
                        <li key={m.ply}>
                          <button type="button" className="moment" onClick={() => goTo(m.ply)}>
                            <span className="dot" style={{ background: CLASS_INFO[m.cls].color }} />
                            {moveLabel(m)} · {CLASS_INFO[m.cls].label}
                            <span className="muted"> −{Math.round(m.loss)}%</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <SummaryCards summary={review.summary} />
                <div className="card">
                  <MoveList moves={review.moves} index={index} onSelect={goTo} />
                </div>
              </>
            ) : (
              <div className="card muted">Menunggu hasil analisis...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
