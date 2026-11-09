import { Chessboard } from 'react-chessboard';

// Pembungkus papan. Mudah diganti library lain nanti karena hanya file ini yang tahu react-chessboard.
export default function Board({
  id = 'board',
  fen,
  orientation = 'white',
  arrows = [],
  squareStyles = {},
  interactive = false,
  onDrop = () => false,
  onSquareClick = () => {},
  onPieceDrag = () => {},
}) {
  return (
    <div className="board-wrap">
      <Chessboard
        options={{
          id,
          position: fen,
          boardOrientation: orientation,
          arrows,
          squareStyles,
          allowDragging: interactive,
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            targetSquare ? onDrop(sourceSquare, targetSquare) : false,
          // Klik petak: dipakai untuk memilih bidak lalu memilih tujuannya. pieceType contoh: 'wP', 'bN'.
          onSquareClick: ({ square, piece }) => onSquareClick(square, piece?.pieceType ?? null),
          onPieceDrag: ({ square, piece }) => onPieceDrag(square, piece?.pieceType ?? null),
          darkSquareStyle: { backgroundColor: '#15202a' },
          lightSquareStyle: { backgroundColor: '#eaf4fc' },
          animationDurationInMs: 200,
        }}
      />
    </div>
  );
}