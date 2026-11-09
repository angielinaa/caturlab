import { summarizeSearch } from '../lib/uci';
 
const ENGINE_URL = '/stockfish/stockfish-19-lite-single.js';
 
// Pembungkus Stockfish yang berjalan di Web Worker (tidak membekukan halaman).
export class StockfishEngine {
  constructor(url = ENGINE_URL) {
    this.worker = new Worker(url);
    this.listeners = new Set();
    this.queue = Promise.resolve(); // antrean: pencarian dijalankan satu per satu
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
 
  // Untuk review. Mengembalikan { cp, mate, bestUci, pv, depth, second } dari sudut pandang
  // pihak yang jalan. Selalu pada kekuatan penuh (Skill Level 20).
  evaluate(fen, depth = 12, multipv = 1) {
    return this.enqueue(() => this.run(fen, { depth, multipv, skill: 20 }));
  }
 
  // Untuk main lawan engine. Mengembalikan langkah UCI (mis. 'e2e4'), atau null jika tidak ada.
  // skill < 20 membuat engine sengaja kurang sempurna; depth kecil membuatnya lebih cepat.
  async bestMove(fen, { skill = 20, depth = 12 } = {}) {
    const result = await this.enqueue(() => this.run(fen, { depth, multipv: 1, skill }));
    return result.bestUci;
  }
 
  enqueue(job) {
    const promise = this.queue.then(job);
    this.queue = promise.catch(() => {}); // satu error tidak boleh menghentikan antrean
    return promise;
  }
 
  async run(fen, { depth, multipv, skill }) {
    await this.ready;
    const lines = [];
    const collect = (line) => lines.push(line);
    this.listeners.add(collect);
    // Opsi disetel ulang tiap pencarian, jadi review dan permainan tidak saling mengganggu.
    this.send(`setoption name Skill Level value ${skill}`);
    this.send(`setoption name MultiPV value ${multipv}`);
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
    await this.waitFor((l) => l.startsWith('bestmove'));
    this.listeners.delete(collect);
    return summarizeSearch(lines);
  }
 
  terminate() {
    this.worker.terminate();
    this.listeners.clear();
  }
}
