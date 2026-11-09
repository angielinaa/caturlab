// Engine Stockfish versi Node untuk skrip terminal: proses yang diajak bicara lewat stdin/stdout.
// Memakai fungsi summarizeSearch yang sama dengan aplikasi di browser.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { summarizeSearch } from '../src/lib/uci.js';
 
export function startEngine() {
  const proc = spawn('node', ['node_modules/stockfish/bin/stockfish-19-lite-single.js']);
  const rl = createInterface({ input: proc.stdout });
  const lines = [];
  let wake = null;
  rl.on('line', (line) => {
    lines.push(line);
    wake?.();
  });
 
  async function nextLine() {
    while (lines.length === 0) await new Promise((resolve) => (wake = resolve));
    return lines.shift();
  }
 
  // Sama bentuknya dengan StockfishEngine.run di browser.
  async function search(fen, { depth = 10, multipv = 1, skill = 20 } = {}) {
    proc.stdin.write(`setoption name Skill Level value ${skill}\n`);
    proc.stdin.write(`setoption name MultiPV value ${multipv}\n`);
    proc.stdin.write(`position fen ${fen}\ngo depth ${depth}\n`);
    const out = [];
    for (;;) {
      const line = await nextLine();
      out.push(line);
      if (line.startsWith('bestmove')) return summarizeSearch(out);
    }
  }
 
  function close() {
    proc.stdin.write('quit\n');
    proc.kill();
  }
 
  return { search, close };
}
