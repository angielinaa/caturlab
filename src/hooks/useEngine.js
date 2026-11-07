import { useCallback, useEffect, useRef } from 'react';
import { StockfishEngine } from '../engine/stockfish.js';
 
// Engine dibuat malas (lazy): baru dibuat saat pertama dibutuhkan, dan dimatikan saat komponen dilepas.
export function useEngine() {
  const ref = useRef(null);
 
  const getEngine = useCallback(() => {
    if (!ref.current) ref.current = new StockfishEngine();
    return ref.current;
  }, []);
 
  useEffect(
    () => () => {
      ref.current?.terminate();
      ref.current = null;
    },
    [],
  );
 
  return getEngine;
}
