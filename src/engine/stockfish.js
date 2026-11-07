import { parseBestMove, parseInfoLine } from '../lib/uci';
 
const ENGINE_URL = '/stockfish/stockfish-19-lite-single.js';
 
// Pembungkus Stockfish yang berjalan di Web Worker (tidak membekukan halaman).
export class StockfishEngine {
  constructor(url = ENGINE_URL) {
    this.worker = new Worker(url);
    this.listeners = new Set();
    this.queue = Promise.resolve(); // antrean: analisis dijalankan satu per satu
 
    this.worker.onmessage = (event) => {
      const line = typeof event.data === 'string' ? event.data : '';
      for (const listener of this.listeners) listener(line);
    };
 
    this.ready = this.init();
  }
 
  send(command) {
    this.worker.postMessage(command);
  }
 
  // Menunggu sampai ada baris keluaran yang cocok dengan `test`.
  waitFor(test) {
    return new Promise((resolve) => {
      const listener = (line) => {
        if (test(line)) {
          this.listeners.delete(listener);
          resolve(line);
        }
      };
      this.listeners.add(listener);
    });
  }
 
  async init() {
    this.send('uci');
    await this.waitFor((l) => l === 'uciok');
    this.send('isready');
    await this.waitFor((l) => l === 'readyok');
  }
 
  // Mengembalikan { cp, mate, bestUci, depth } dari sudut pandang pihak yang jalan.
  evaluate(fen, depth = 12) {
    const job = this.queue.then(() => this.run(fen, depth));
    this.queue = job.catch(() => {}); // satu error tidak boleh menghentikan antrean
    return job;
  }
 
  async run(fen, depth) {
    await this.ready;
    let last = null;
    const track = (line) => {
      const info = parseInfoLine(line);
      if (info && !info.bound) last = info;
    };
    this.listeners.add(track);
 
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
    const bestLine = await this.waitFor((l) => l.startsWith('bestmove'));
    this.listeners.delete(track);
 
    return {
      cp: last?.cp ?? null,
      mate: last?.mate ?? null,
      depth: last?.depth ?? 0,
      bestUci: parseBestMove(bestLine),
    };
  }
 
  terminate() {
    this.worker.terminate();
    this.listeners.clear();
  }
}
