// Mendeteksi fase permainan dan membuat profil kelemahan dari hasil review.
 
export const PHASES = ['opening', 'middlegame', 'endgame'];
export const PHASE_LABELS = { opening: 'Pembukaan', middlegame: 'Middlegame', endgame: 'Endgame' };
 
const VALUES = { n: 3, b: 3, r: 5, q: 9 };
 
// Fase ditentukan dari nomor langkah dan sisa material (tanpa pion dan raja).
export function detectPhase(fen) {
  const [board, , , , , full] = fen.split(' ');
  let material = 0;
  for (const ch of board) material += VALUES[ch.toLowerCase()] ?? 0;
  if (material <= 26) return 'endgame';
  if (Number(full) <= 10) return 'opening';
  return 'middlegame';
}
 
const emptyPhase = () => ({ moves: 0, inaccuracy: 0, mistake: 0, blunder: 0 });
 
export function emptyProfile() {
  return { games: 0, phases: Object.fromEntries(PHASES.map((p) => [p, emptyPhase()])) };
}
 
// Hitung kesalahan milik pemain (satu warna) dari hasil review satu game.
export function profileFromReview(reviewMoves, color) {
  const profile = emptyProfile();
  const side = color === 'white' ? 'w' : 'b';
  profile.games = 1;
  for (const m of reviewMoves) {
    if (m.color !== side) continue;
    const ph = profile.phases[m.phase];
    ph.moves += 1;
    if (m.cls in ph) ph[m.cls] += 1;
  }
  return profile;
}
 
export function mergeProfiles(a, b) {
  const out = emptyProfile();
  out.games = a.games + b.games;
  for (const p of PHASES) {
    for (const k of Object.keys(out.phases[p])) out.phases[p][k] = a.phases[p][k] + b.phases[p][k];
  }
  return out;
}
 
// Skor kesalahan per langkah: kurang akurat = 1, kesalahan = 2, blunder = 3.
export function errorScore(phase) {
  if (phase.moves === 0) return 0;
  return (phase.inaccuracy + phase.mistake * 2 + phase.blunder * 3) / phase.moves;
}
 
const PLAN = {
  opening: { lessons: ['pembukaan-dasar', 'cct'], themes: ['bidak-menggantung'] },
  middlegame: { lessons: ['taktik-fork-pin', 'cct'], themes: ['fork', 'skewer', 'bidak-menggantung'] },
  endgame: { lessons: ['endgame-dasar'], themes: ['mate'] },
};
 
// Rekomendasi latihan dari fase terlemah (butuh minimal 3 langkah di fase itu).
export function recommend(profile) {
  if (profile.games === 0) return null;
  const ranked = PHASES.filter((p) => profile.phases[p].moves >= 3)
    .map((p) => ({ phase: p, score: errorScore(profile.phases[p]) }))
    .sort((x, y) => y.score - x.score);
  if (ranked.length === 0) return null;
  const weakest = ranked[0].phase;
  return { weakestPhase: weakest, ...PLAN[weakest] };
}
