// Membaca keluaran Stockfish (protokol UCI). Fungsi murni, mudah dites.
// Contoh baris: "info depth 12 seldepth 18 multipv 1 score cp 32 nodes 25009 pv e2e4 e7e5"
export function parseInfoLine(line) {
  if (!line.startsWith('info') || !line.includes(' score ')) return null;
  const tokens = line.trim().split(/\s+/);
  const valueOf = (key) => {
    const i = tokens.indexOf(key);
    return i === -1 ? null : tokens[i + 1];
  };
  const s = tokens.indexOf('score');
  const kind = tokens[s + 1]; // 'cp' atau 'mate'
  const value = Number(tokens[s + 2]);
  const bound = tokens[s + 3] === 'lowerbound' || tokens[s + 3] === 'upperbound';
  const p = tokens.indexOf('pv');
  return {
    multipv: Number(valueOf('multipv') ?? 1), // 1 = jalur terbaik, 2 = terbaik kedua
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
 
// Merangkum semua baris keluaran SATU pencarian menjadi satu hasil:
// { cp, mate, depth, pv, bestUci, second } dari sudut pandang pihak yang jalan.
// `second` = skor langkah terbaik kedua (hanya ada jika engine diminta MultiPV 2).
export function summarizeSearch(lines) {
  const byPv = {};
  let bestUci = null;
  for (const line of lines) {
    const best = parseBestMove(line);
    if (best) bestUci = best;
    const info = parseInfoLine(line);
    if (info && !info.bound) byPv[info.multipv] = info; // baris terakhir = kedalaman terdalam
  }
  const top = byPv[1] ?? null;
  const second = byPv[2] ?? null;
  return {
    cp: top?.cp ?? null,
    mate: top?.mate ?? null,
    depth: top?.depth ?? 0,
    pv: top?.pv ?? [],
    bestUci,
    second: second ? { cp: second.cp, mate: second.mate } : null,
  };
}