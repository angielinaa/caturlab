import { useState } from 'react';
import Board from '../components/Board.jsx';
import { PUZZLES } from '../data/puzzles.js';
import { checkPuzzleMove } from '../lib/puzzle.js';
 
function PuzzleBoard({ puzzle, onSolved }) {
  const [fen, setFen] = useState(puzzle.fen);
  const [state, setState] = useState('idle'); // idle | wrong | solved
  const [showHint, setShowHint] = useState(false);
  const orientation = puzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black';
 
  function handleDrop(from, to) {
    if (state === 'solved') return false;
    const result = checkPuzzleMove(puzzle, from, to);
    if (!result.legal) return false;
    if (!result.correct) {
      setState('wrong');
      return false; // bidak kembali ke tempat semula
    }
    setFen(result.fenAfter);
    setState('solved');
    onSolved(puzzle.id);
    return true;
  }
 
  return (
    <div className="puzzle-layout">
      <Board
        id={`puzzle-${puzzle.id}`}
        fen={fen}
        orientation={orientation}
        interactive={state !== 'solved'}
        onDrop={handleDrop}
      />
      <div className="card">
        <h3>{puzzle.title}</h3>
        <p className="muted">Giliran {orientation === 'white' ? 'putih' : 'hitam'}. Temukan langkah terbaik.</p>
        {state === 'wrong' && <p className="error">Belum tepat, coba lagi.</p>}
        {state === 'solved' && (
          <p className="success">
            Benar! {puzzle.explanation}
          </p>
        )}
        {showHint && state !== 'solved' && <p className="tip">Petunjuk: {puzzle.hint}</p>}
        {state !== 'solved' && (
          <button type="button" onClick={() => setShowHint(true)}>
            Petunjuk
          </button>
        )}
      </div>
    </div>
  );
}
 
export default function PuzzlePage() {
  const [i, setI] = useState(0);
  const [solved, setSolved] = useState(() => new Set());
  const puzzle = PUZZLES[i];
 
  return (
    <div>
      <div className="nav">
        <button type="button" onClick={() => setI(i - 1)} disabled={i === 0}>
          ‹ Sebelumnya
        </button>
        <span>
          Puzzle {i + 1} / {PUZZLES.length} · terpecahkan {solved.size}
        </span>
        <button type="button" onClick={() => setI(i + 1)} disabled={i === PUZZLES.length - 1}>
          Berikutnya ›
        </button>
      </div>
      {/* key = id puzzle: komponen dibuat ulang tiap ganti puzzle, state otomatis bersih */}
      <PuzzleBoard
        key={puzzle.id}
        puzzle={puzzle}
        onSolved={(id) => setSolved((s) => new Set(s).add(id))}
      />
    </div>
  );
}
