import { useEffect, useMemo, useState } from 'react';
import Board from '../components/Board.jsx';
import { mergeStyles, selectionStyles } from '../lib/highlight.js';
import { LEVELS, applyMove, applyUci, buildPgn, legalTargets, replay, resignResult } from '../lib/play.js';

const THINK_MIN_MS = 400; // jeda minimal supaya langkah engine tidak terasa "kilat"

// Sorot petak asal dan tujuan langkah terakhir (kuning lembut).
function lastMoveStyles(last) {
  if (!last) return {};
  const style = { boxShadow: 'inset 0 0 0 100px #f5c84266' };
  return { [last.from]: style, [last.to]: style };
}

// active: halaman sedang tampil. Papan hanya dipasang saat tampil, karena papan tidak bisa dipasang di
// elemen tersembunyi (lebarnya 0).
export default function PlayPage({ getEngine, onFinish, active = true }) {
  const [levelId, setLevelId] = useState('menengah');
  const [color, setColor] = useState('white');
  const [sans, setSans] = useState([]); // daftar langkah (SAN). Semua hal lain diturunkan dari sini.
  const [gameId, setGameId] = useState(0); // 0 = belum ada game. Naik 1 tiap game baru.
  const [resigned, setResigned] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // petak bidak yang sedang dipilih (untuk klik-untuk-jalan)

  const level = LEVELS.find((l) => l.id === levelId);
  const state = useMemo(() => replay(sans), [sans]);
  const started = gameId > 0;
  const over = resigned || state.status.over;
  const result = resigned ? resignResult(color) : state.status.result;
  const myLetter = color === 'white' ? 'w' : 'b';
  const myTurn = state.turn === myLetter;
  const locked = started && !over && sans.length > 0; // tingkat dan warna dikunci selama game berjalan
  const canMove = started && !over && myTurn && !thinking;
  const targets = useMemo(() => (selected ? legalTargets(state.fen, selected) : []), [selected, state.fen]);

  function startGame() {
    setSans([]);
    setResigned(false);
    setThinking(false);
    setError('');
    setSelected(null);
    setGameId((n) => n + 1);
  }

  // Giliran engine: minta langkah ke Stockfish, lalu mainkan.
  useEffect(() => {
    if (!started || over || myTurn) return undefined;
    let cancelled = false;
    const t0 = Date.now();
    setThinking(true);
    getEngine()
      .bestMove(state.fen, level)
      .then(async (uci) => {
        const wait = THINK_MIN_MS - (Date.now() - t0);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        if (cancelled) return;
        const move = uci ? applyUci(state.fen, uci) : { legal: false };
        if (!move.legal) throw new Error('engine tidak memberi langkah yang legal');
        setSans((s) => [...s, move.san]);
        setThinking(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(`Engine bermasalah: ${e.message}`);
        setThinking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, started, over, myTurn, state.fen, getEngine, level]);

  // Memainkan langkahmu. Mengembalikan true jika diterima, false jika ilegal (bidak harus kembali).
  function makeMove(from, to) {
    setSelected(null);
    const move = applyMove(state.fen, from, to);
    if (!move.legal) return false;
    setSans((s) => [...s, move.san]);
    return true;
  }

  // Cara 1: seret bidak ke petak tujuan.
  function handleDrop(from, to) {
    return canMove ? makeMove(from, to) : false;
  }

  // Cara 2: klik bidakmu (tujuan yang legal disorot), lalu klik petak tujuan.
  function handleSquareClick(square, pieceType) {
    if (!canMove) return;
    if (selected && targets.some((t) => t.to === square)) {
      makeMove(selected, square);
    } else if (pieceType && pieceType[0] === myLetter && square !== selected) {
      setSelected(square); // pilih bidak ini (atau pindah pilihan ke bidak lain)
    } else {
      setSelected(null); // klik petak lain atau bidak yang sama: batalkan pilihan
    }
  }

  // Saat mulai menyeret bidakmu, tujuan legalnya juga disorot.
  function handlePieceDrag(square, pieceType) {
    if (canMove && pieceType?.[0] === myLetter) setSelected(square);
  }

  function finish() {
    const engineName = `Stockfish ${level.label}`;
    const pgn = buildPgn(sans, {
      white: color === 'white' ? 'Kamu' : engineName,
      black: color === 'white' ? engineName : 'Kamu',
      result: over ? result : '*',
    });
    onFinish({ pgn, color, levelLabel: level.label, result });
  }

  let statusText = 'Pilih tingkat dan warna, lalu mulai game.';
  if (started) {
    if (resigned) statusText = 'Kamu menyerah.';
    else if (state.status.over) statusText = state.status.text;
    else statusText = myTurn && !thinking ? 'Giliranmu.' : 'Engine berpikir...';
  }

  // Daftar langkah ditulis sebagai teks: "1. e4 e5 2. Nf3 ..."
  const movesText = sans.map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san)).join(' ');

  return (
    <div className="play-layout">
      <div>
        {active && (
          <Board
            id="play-board"
            fen={state.fen}
            orientation={color}
            squareStyles={mergeStyles(lastMoveStyles(state.last), selectionStyles(selected, targets))}
            interactive={canMove}
            onDrop={handleDrop}
            onSquareClick={handleSquareClick}
            onPieceDrag={handlePieceDrag}
          />
        )}
      </div>
      <div className="side-panel">
        <section className="card">
          <div className="controls">
            <label>
              Tingkat lawan
              <select value={levelId} onChange={(e) => setLevelId(e.target.value)} disabled={locked}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Aku main sebagai
              <select value={color} onChange={(e) => setColor(e.target.value)} disabled={locked}>
                <option value="white">Putih</option>
                <option value="black">Hitam</option>
              </select>
            </label>
            <button type="button" onClick={startGame}>
              {started ? 'Game baru' : 'Mulai game'}
            </button>
          </div>
        </section>
        <section className="card">
          <p className="status" role="status">
            {statusText}
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {movesText && <p className="moves-text">{movesText}</p>}
          <div className="controls">
            {started && !over && (
              <button type="button" className="ghost" onClick={() => setResigned(true)}>
                Menyerah
              </button>
            )}
            {sans.length >= 2 && (
              <button type="button" onClick={finish}>
                {over ? 'Review game ini' : 'Akhiri dan review'}
              </button>
            )}
          </div>
        </section>
        <p className="muted">
          Setelah game selesai, tekan Review: setiap langkahmu dinilai, lengkap dengan replay dan langkah yang lebih
          baik.
        </p>
      </div>
    </div>
  );
}