import { useEffect, useRef, useState } from 'react';
import Board from '../components/Board.jsx';
import EvalGraph from '../components/EvalGraph.jsx';
import MoveList from '../components/MoveList.jsx';
import SummaryCards from '../components/SummaryCards.jsx';
import { SAMPLE_PGN } from '../data/samples.js';
import { analyzeGame } from '../lib/analyze.js';
import { CLASS_INFO } from '../lib/analysis.js';
import { explainMove, tipForClass } from '../lib/explain.js';
import { parsePgn } from '../lib/game.js';
import { buildReview } from '../lib/review.js';
import { profileFromReview } from '../lib/weakness.js';
 
export default function ReviewPage({ getEngine, onProfileUpdate }) {
  const [pgn, setPgn] = useState(SAMPLE_PGN);
  const [color, setColor] = useState('white');
  const [depth, setDepth] = useState(12);
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [game, setGame] = useState(null);
  const [review, setReview] = useState(null);
  const [index, setIndex] = useState(0); // 0 = posisi awal, n = setelah langkah ke-n
  const cancelRef = useRef(false);
 
  async function handleAnalyze() {
    setError('');
    let parsed;
    try {
      parsed = parsePgn(pgn);
    } catch (e) {
      setError(`PGN tidak valid: ${e.message}`);
      return;
    }
 
    cancelRef.current = false;
    setGame(parsed);
    setReview(null);
    setIndex(0);
    setStatus('running');
    setProgress({ done: 0, total: parsed.positions.length });
 
    try {
      const engine = getEngine();
      const evals = await analyzeGame(parsed.positions, (fen, d) => engine.evaluate(fen, d), {
        depth,
        onProgress: (done, total) => setProgress({ done, total }),
        shouldCancel: () => cancelRef.current,
      });
      const result = buildReview(parsed.moves, evals);
      setReview(result);
      setStatus('done');
      onProfileUpdate(profileFromReview(result.moves, color));
    } catch (e) {
      if (e.message === 'CANCELLED') {
        setStatus('idle');
      } else {
        setError(`Analisis gagal: ${e.message}`);
        setStatus('error');
      }
    }
  }
 
  // Navigasi dengan tombol panah kiri/kanan.
  useEffect(() => {
    if (!review) return undefined;
    const max = review.moves.length;
    const onKey = (e) => {
      if (e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(max, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [review]);
 
  const current = review && index > 0 ? review.moves[index - 1] : null;
  const fen = game ? game.positions[index] : 'start';
  const arrows =
    current && current.bestUci && current.cls !== 'best'
      ? [{ startSquare: current.bestUci.slice(0, 2), endSquare: current.bestUci.slice(2, 4), color: '#22a559' }]
      : [];
  const squareStyles = current
    ? {
        [current.uci.slice(2, 4)]: { boxShadow: `inset 0 0 0 4px ${CLASS_INFO[current.cls].color}` },
      }
    : {};
 
  return (
    <div className="review">
      <section className="card">
        <label htmlFor="pgn">Tempel PGN game-mu (dari Lichess, chess.com, atau aplikasi lain)</label>
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
            <button type="button" onClick={handleAnalyze}>
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
            <Board id="review-board" fen={fen} orientation={color} arrows={arrows} squareStyles={squareStyles} />
            <div className="nav">
              <button type="button" onClick={() => setIndex(0)} disabled={index === 0}>
                «
              </button>
              <button type="button" onClick={() => setIndex(index - 1)} disabled={index === 0}>
                ‹
              </button>
              <span>
                {index} / {game.moves.length}
              </span>
              <button type="button" onClick={() => setIndex(index + 1)} disabled={index === game.moves.length}>
                ›
              </button>
              <button type="button" onClick={() => setIndex(game.moves.length)} disabled={index === game.moves.length}>
                »
              </button>
            </div>
          </div>
 
          <div className="side-panel">
            {review ? (
              <>
                <div className="card">
                  <EvalGraph evals={review.evals} index={index} onSelect={setIndex} />
                  <p className="explain">{explainMove(current)}</p>
                  {current && tipForClass(current.cls) && <p className="tip">{tipForClass(current.cls)}</p>}
                </div>
                <SummaryCards summary={review.summary} />
                <div className="card">
                  <MoveList moves={review.moves} index={index} onSelect={setIndex} />
                </div>
              </>
            ) : (
              <div className="card muted">Menunggu hasil analisis…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
