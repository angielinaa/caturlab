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
          darkSquareStyle: { backgroundColor: '#b7584f' },
          lightSquareStyle: { backgroundColor: '#f6e6e4' },
          animationDurationInMs: 200,
        }}
      />
    </div>
  );
}
