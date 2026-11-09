import { emptyProfile } from './weakness.js';
 
const KEY = 'caturlab:profile';
 
// localStorage bisa gagal (mode privat, kuota penuh), jadi selalu dibungkus try/catch.
export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : emptyProfile();
  } catch {
    return emptyProfile();
  }
}
 
export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* abaikan: profil hanya fitur tambahan */
  }
}
 
export function clearProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}
 
const GAME_KEY = 'caturlab:lastGame';
 
// Game terakhir yang kamu mainkan: { pgn, color, levelLabel, result }.
export function saveLastGame(game) {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  } catch {
    /* abaikan */
  }
}
 
export function loadLastGame() {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
