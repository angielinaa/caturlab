// Menyalin engine Stockfish (WASM) dari node_modules ke public/ supaya bisa dimuat browser.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
 
const SRC = 'node_modules/stockfish/bin';
const DEST = 'public/stockfish';
const FILES = ['stockfish-19-lite-single.js', 'stockfish-19-lite-single.wasm'];
 
if (!existsSync(SRC)) {
  console.log('[copy-engine] paket stockfish belum terpasang, dilewati.');
  process.exit(0);
}
mkdirSync(DEST, { recursive: true });
for (const file of FILES) cpSync(`${SRC}/${file}`, `${DEST}/${file}`);
console.log('[copy-engine] Stockfish disalin ke public/stockfish');
