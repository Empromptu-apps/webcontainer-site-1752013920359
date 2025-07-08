import React, { useState, useEffect } from 'react';

const CheckersGame = ({ darkMode }) => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [gameStatus, setGameStatus] = useState('playing');
  const [agentId, setAgentId] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [apiCalls, setApiCalls] = useState([]);
  const [gameData, setGameData] = useState([]);

  function initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'black', isKing: false };
        }
      }
    }
    
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'red', isKing: false };
        }
      }
    }
    
    return board;
  }

  const logApiCall = (method, endpoint, data, response) => {
    const call = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      data,
      response
    };
    setApiCalls(prev => [call, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    const createAgent = async () => {
      try {
        const requestData = {
          instructions: `You are a checkers AI opponent with moderate skill. You understand standard 8x8 checkers rules including: regular pieces move diagonally forward, kings can move diagonally in any direction, captures are mandatory, multiple jumps in one turn are required if possible. You should make strategic moves that balance offense and defense, but don't need to be perfect. When given a board state, analyze it and return your move in the format: "from_row,from_col to to_row,to_col" (like "2,1 to 3,2"). Always validate moves are legal before suggesting them.`,
          agent_name: "Checkers AI"
        };

        const response = await fetch('http://localhost:8080/api_tools/create-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
            'X-Generated-App-ID': 'f90b7499-c495-4817-bb4b-9b98df8a1969'
          },
          body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        logApiCall('POST', '/create-agent', requestData, data);
        setAgentId(data.agent_id);
      } catch (error) {
        console.error('Failed to create AI agent:', error);
        logApiCall('POST', '/create-agent', requestData, { error: error.message });
      }
    };
    
    createAgent();
  }, []);

  const handleSquareClick = (row, col) => {
    if (currentPlayer !== 'red' || isAiThinking) return;

    if (selectedSquare) {
      if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
        makeMove(selectedSquare.row, selectedSquare.col, row, col);
      }
      setSelectedSquare(null);
    } else {
      if (board[row][col] && board[row][col].color === 'red') {
        setSelectedSquare({ row, col });
      }
    }
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];
    if (!piece || board[toRow][toCol]) return false;
    
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    if (Math.abs(rowDiff) !== colDiff) return false;
    
    if (!piece.isKing) {
      if (piece.color === 'red' && rowDiff > 0) return false;
      if (piece.color === 'black' && rowDiff < 0) return false;
    }
    
    if (Math.abs(rowDiff) === 1) return true;
    if (Math.abs(rowDiff) === 2) {
      const middleRow = fromRow + rowDiff / 2;
      const middleCol = fromCol + (toCol - fromCol) / 2;
      const middlePiece = board[middleRow][middleCol];
      return middlePiece && middlePiece.color !== piece.color;
    }
    
    return false;
  };

  const makeMove = async (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    if (Math.abs(toRow - fromRow) === 2) {
      const middleRow = fromRow + (toRow - fromRow) / 2;
      const middleCol = fromCol + (toCol - fromCol) / 2;
      newBoard[middleRow][middleCol] = null;
    }
    
    if (piece.color === 'red' && toRow === 0) piece.isKing = true;
    if (piece.color === 'black' && toRow === 7) piece.isKing = true;
    
    setBoard(newBoard);
    
    // Store game move data
    const moveData = {
      player: currentPlayer,
      from: `${fromRow},${fromCol}`,
      to: `${toRow},${toCol}`,
      timestamp: new Date().toISOString(),
      boardState: boardToString(newBoard)
    };
    
    try {
      const requestData = {
        created_object_name: 'checkers_moves',
        data_type: 'strings',
        input_data: [JSON.stringify(moveData)]
      };

      const response = await fetch('http://localhost:8080/api_tools/input_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
          'X-Generated-App-ID': 'f90b7499-c495-4817-bb4b-9b98df8a1969'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      logApiCall('POST', '/input_data', requestData, data);
    } catch (error) {
      console.error('Failed to store move data:', error);
    }
    
    setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
  };

  useEffect(() => {
    if (currentPlayer === 'black' && agentId && !isAiThinking) {
      getAiMove();
    }
  }, [currentPlayer, agentId]);

  const getAiMove = async () => {
    setIsAiThinking(true);
    try {
      const boardString = boardToString(board);
      const requestData = {
        agent_id: agentId,
        message: `Current board state (R=red, B=black, K=king, .=empty):\n${boardString}\n\nIt's black's turn. What's your move? Respond with just the move in format "from_row,from_col to to_row,to_col"`
      };

      const response = await fetch('http://localhost:8080/api_tools/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
          'X-Generated-App-ID': 'f90b7499-c495-4817-bb4b-9b98df8a1969'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      logApiCall('POST', '/chat', requestData, data);
      
      const moveMatch = data.response.match(/(\d),(\d) to (\d),(\d)/);
      
      if (moveMatch) {
        const [, fromRow, fromCol, toRow, toCol] = moveMatch.map(Number);
        if (isValidMove(fromRow, fromCol, toRow, toCol)) {
          setTimeout(() => {
            makeMove(fromRow, fromCol, toRow, toCol);
            setIsAiThinking(false);
          }, 1000);
        } else {
          setIsAiThinking(false);
        }
      } else {
        setIsAiThinking(false);
      }
    } catch (error) {
      console.error('AI move failed:', error);
      logApiCall('POST', '/chat', requestData, { error: error.message });
      setIsAiThinking(false);
    }
  };

  const boardToString = (board) => {
    return board.map(row => 
      row.map(cell => {
        if (!cell) return '.';
        if (cell.color === 'red') return cell.isKing ? 'RK' : 'R';
        return cell.isKing ? 'BK' : 'B';
      }).join(' ')
    ).join('\n');
  };

  const renderSquare = (row, col) => {
    const piece = board[row][col];
    const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
    const isDark = (row + col) % 2 === 1;
    
    return (
      <button
        key={`${row}-${col}`}
        className={`
          w-16 h-16 flex items-center justify-center transition-all duration-200
          ${isDark 
            ? (darkMode ? 'bg-amber-800 hover:bg-amber-700' : 'bg-amber-700 hover:bg-amber-600')
            : (darkMode ? 'bg-amber-200 hover:bg-amber-100' : 'bg-amber-100 hover:bg-amber-50')
          }
          ${isSelected ? 'ring-4 ring-primary-500' : ''}
          focus:outline-none focus:ring-2 focus:ring-primary-400
        `}
        onClick={() => handleSquareClick(row, col)}
        aria-label={`Square ${row}-${col}${piece ? ` with ${piece.color} ${piece.isKing ? 'king' : 'piece'}` : ''}`}
      >
        {piece && (
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2
            ${piece.color === 'red' 
              ? 'bg-red-600 border-red-800' 
              : 'bg-gray-800 border-gray-900'
            }
          `}>
            {piece.isKing ? '♔' : '●'}
          </div>
        )}
      </button>
    );
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('red');
    setGameStatus('playing');
    setIsAiThinking(false);
  };

  return (
    <div className={`rounded-2xl shadow-lg p-8 ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            currentPlayer === 'red' 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            Current Player: {currentPlayer === 'red' ? 'You (Red)' : 'AI (Black)'}
          </div>
          {isAiThinking && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="spinner"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
            </div>
          )}
        </div>
        
        <div className={`grid grid-cols-8 gap-0 border-4 rounded-lg overflow-hidden ${
          darkMode ? 'border-gray-600' : 'border-gray-800'
        }`}>
          {board.map((row, rowIndex) => 
            row.map((_, colIndex) => renderSquare(rowIndex, colIndex))
          )}
        </div>

        <button
          onClick={resetGame}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400"
          aria-label="Reset game"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
};

export default CheckersGame;
