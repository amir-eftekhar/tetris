import React, { useState, useEffect, useCallback } from 'react';

const TETROMINOES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_15px_#22d3ee]'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_15px_#3b82f6]'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_15px_#fb923c]'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_15px_#facc15]'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-[0_0_15px_#a855f7]'
  }
};

const BOARD_SIZE = 14;
const BASE_SPEED = 600;
const FAST_SPEED = 50;

const Tetris = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isClearing, setIsClearing] = useState(false);
  const [isFastDrop, setIsFastDrop] = useState(false);
  const [fastDropInterval, setFastDropInterval] = useState(null);

  function createEmptyBoard() {
    return Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
  }

  const generatePiece = useCallback(() => {
    const pieces = Object.keys(TETROMINOES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
      shape: TETROMINOES[randomPiece].shape,
      color: TETROMINOES[randomPiece].color
    };
  }, []);

  const checkCollision = useCallback((piece, pos) => {
    if (!piece) return false;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          
          if (
            newX < 0 ||
            newX >= BOARD_SIZE ||
            newY >= BOARD_SIZE ||
            (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver) return;

    const rotated = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
      )
    };

    if (!checkCollision(rotated, position)) {
      setCurrentPiece(rotated);
    }
  }, [currentPiece, position, checkCollision, gameOver]);

  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || gameOver || isClearing) return;

    const newPos = { x: position.x + dx, y: position.y + dy };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
      return true;
    }
    return false;
  }, [currentPiece, position, checkCollision, gameOver, isClearing]);

  const clearRows = useCallback(() => {
    const newBoard = [...board];
    let clearedRows = 0;
    let rowsToClear = [];

    for (let y = BOARD_SIZE - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        rowsToClear.push(y);
        clearedRows++;
      }
    }

    if (clearedRows > 0) {
      setIsClearing(true);

      // Animate the clearing rows
      setTimeout(() => {
        rowsToClear.forEach(y => {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(BOARD_SIZE).fill(null));
        });
        setBoard(newBoard);
        setScore(score => score + (clearedRows * 10));
        setIsClearing(false);
      }, 200);

      // Update the board immediately with the flashing effect
      const flashBoard = [...board];
      rowsToClear.forEach(y => {
        flashBoard[y] = flashBoard[y].map(() => 
          'bg-gradient-to-r from-white to-white shadow-[0_0_20px_#ffffff]'
        );
      });
      setBoard(flashBoard);
    }
  }, [board, speedMultiplier]);

  const mergePiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const newY = position.y + y;
          if (newY >= 0) {
            newBoard[newY][position.x + x] = currentPiece.color;
          }
        }
      });
    });

    setBoard(newBoard);
    
    // Check and clear rows first
    const rowsToClear = [];
    for (let y = BOARD_SIZE - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        rowsToClear.push(y);
      }
    }

    if (rowsToClear.length > 0) {
      setIsClearing(true);
      
      // Animate the clearing rows
      const flashBoard = [...newBoard];
      rowsToClear.forEach(y => {
        flashBoard[y] = flashBoard[y].map(() => 
          'bg-gradient-to-r from-white to-white shadow-[0_0_20px_#ffffff]'
        );
      });
      setBoard(flashBoard);

      // Wait for animation before spawning new piece
      setTimeout(() => {
        const finalBoard = [...newBoard];
        rowsToClear.forEach(y => {
          finalBoard.splice(y, 1);
          finalBoard.unshift(Array(BOARD_SIZE).fill(null));
        });
        setBoard(finalBoard);
        setScore(score => score + (rowsToClear.length * 10));
        setIsClearing(false);
        
        // Generate new piece after clearing
        const newPiece = generatePiece();
        setCurrentPiece(newPiece);
        setPosition({ x: Math.floor(BOARD_SIZE / 2) - 1, y: 0 });

        if (checkCollision(newPiece, { x: Math.floor(BOARD_SIZE / 2) - 1, y: 0 })) {
          setGameOver(true);
        }
      }, 200);
    } else {
      // If no rows to clear, immediately spawn new piece
      const newPiece = generatePiece();
      setCurrentPiece(newPiece);
      setPosition({ x: Math.floor(BOARD_SIZE / 2) - 1, y: 0 });

      if (checkCollision(newPiece, { x: Math.floor(BOARD_SIZE / 2) - 1, y: 0 })) {
        setGameOver(true);
      }
    }
  }, [currentPiece, position, board, generatePiece, checkCollision]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          setIsFastDrop(true);
          // Only start scoring if we can actually move down
          if (movePiece(0, 1)) {
            const interval = setInterval(() => {
              if (movePiece(0, 1)) {
                setScore(prev => prev + 1);
              } else {
                clearInterval(fastDropInterval);
                setFastDropInterval(null);
                setIsFastDrop(false);
              }
            }, FAST_SPEED);
            setFastDropInterval(interval);
          }
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowDown') {
        setIsFastDrop(false);
        if (fastDropInterval) {
          clearInterval(fastDropInterval);
          setFastDropInterval(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [movePiece, rotatePiece, gameOver]);

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      const piece = generatePiece();
      setCurrentPiece(piece);
      setPosition({ x: Math.floor(BOARD_SIZE / 2) - 1, y: 0 });
    }

    const gameLoop = setInterval(() => {
      if (!gameOver && !isClearing) {
        if (!movePiece(0, 1)) {
          mergePiece();
        }
      }
    }, isFastDrop ? FAST_SPEED : BASE_SPEED / speedMultiplier);

    return () => {
      clearInterval(gameLoop);
      if (fastDropInterval) {
        clearInterval(fastDropInterval);
        setFastDropInterval(null);
      }
    };
  }, [currentPiece, generatePiece, movePiece, mergePiece, gameOver, speedMultiplier, isFastDrop, isClearing]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    if (currentPiece && !isClearing) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const newY = position.y + y;
            if (newY >= 0) {
              displayBoard[newY][position.x + x] = currentPiece.color;
            }
          }
        });
      });
    }

    return displayBoard;
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setPosition({ x: 0, y: 0 });
    setGameOver(false);
    setScore(0);
    setIsClearing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 gap-6">
      <div className="flex items-center gap-8">
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Score: {score}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-white">Speed:</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
            className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <div className="relative bg-gray-800/50 p-2 rounded-xl backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <div 
          className="grid gap-1 rounded-lg overflow-hidden"
          style={{ 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            width: '560px'
          }}
        >
          {renderBoard().map((row, y) => 
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={`aspect-square transition-all duration-200 ${
                  cell || 'bg-gray-700/50 border border-gray-600/30'
                } ${isClearing ? 'scale-95 rotate-3' : ''}`}
              />
            ))
          )}
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <button
              onClick={resetGame}
              className="px-8 py-4 text-2xl font-bold rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white transform hover:scale-105 transition-all duration-200 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tetris;