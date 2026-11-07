// Membaca keluaran Stockfish (protokol UCI). Fungsi murni, mudah dites.
 
// Contoh baris: "info depth 12 seldepth 18 multipv 1 score cp 32 nodes 25009 pv e2e4 e7e5"
export function parseInfoLine(line) {
  if (!line.startsWith('info') || !line.includes(' score ')) return null;
  const tokens = line.trim().split(/\s+/);
  const valueOf = (key) => {
    const i = tokens.indexOf(key);
    return i === -1 ? null : tokens[i + 1];
  };
 
  if (Number(valueOf('multipv') ?? 1) !== 1) return null; // hanya jalur terbaik
 
  const s = tokens.indexOf('score');
  const kind = tokens[s + 1]; // 'cp' atau 'mate'
  const value = Number(tokens[s + 2]);
  const bound = tokens[s + 3] === 'lowerbound' || tokens[s + 3] === 'upperbound';
  const p = tokens.indexOf('pv');
 
  return {
    depth: Number(valueOf('depth')),
    cp: kind === 'cp' ? value : null,
    mate: kind === 'mate' ? value : null,
    bound, // true = skor belum pasti, abaikan
    pv: p === -1 ? [] : tokens.slice(p + 1),
  };
}
 
// Contoh: "bestmove g1f3 ponder b8c6" -> "g1f3". "bestmove (none)" -> null.
export function parseBestMove(line) {
  if (!line.startsWith('bestmove')) return null;
  const move = line.trim().split(/\s+/)[1];
  return move && move !== '(none)' ? move : null;
}
