// Wait for the DOM to be fully loaded before executing code
document.addEventListener('DOMContentLoaded', () => {
    let board = null; // Initialize the chessboard
    const game = new Chess(); // Create new Chess.js game instance
    const moveHistory = document.getElementById('move-history'); // Get move history container
    let moveCount = 1; // Initialize the move count
    let userColor = 'w'; // Initialize the user's color as white
    const stockfish = new Worker('https://cdn.rawgit.com/nmrugg/stockfish.js/master/stockfish.js'); // Initialize Stockfish

    // Function to make a move for the computer using Stockfish
    const makeStockfishMove = () => {
        if (game.game_over()) {
            alert("Checkmate!");
            return;
        }

        stockfish.postMessage(`position fen ${game.fen()}`); // Send the current position to Stockfish
        stockfish.postMessage('go depth 10'); // You can adjust the depth as needed

        // Receive the move from Stockfish
        stockfish.onmessage = (event) => {
            const move = event.data;

            // If a move is returned
            if (move.includes("bestmove")) {
                const bestMove = move.split(" ")[1]; // Extract the best move
                game.move(bestMove); // Make the move in the game
                board.position(game.fen()); // Update the board position
                recordMove(bestMove, moveCount); // Record and display the move with move count
                moveCount++; // Increment the move count
            }
        };
    };

    // Function to record and display a move in the move history
    const recordMove = (move, count) => {
        const formattedMove = count % 2 === 1 ? `${Math.ceil(count / 2)}. ${move}` : `${move} -`;
        moveHistory.textContent += formattedMove + ' ';
        moveHistory.scrollTop = moveHistory.scrollHeight; // Auto-scroll to the latest move
    };

    // Function to handle the start of a drag position
    const onDragStart = (source, piece) => {
        return !game.game_over() && piece.search(userColor) === 0;
    };

    // Function to handle a piece drop on the board
    const onDrop = (source, target) => {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q',
        });

        if (move === null) return 'snapback';

        window.setTimeout(makeStockfishMove, 250); // Call Stockfish to make a move
        recordMove(move.san, moveCount); // Record and display the move with move count
        moveCount++;
    };

    // Function to handle the end of a piece snap animation
    const onSnapEnd = () => {
        board.position(game.fen());
    };

    // Configuration options for the chessboard
    const boardConfig = {
        showNotation: true,
        draggable: true,
        position: 'start',
        onDragStart,
        onDrop,
        onSnapEnd,
        moveSpeed: 'fast',
        snapBackSpeed: 500,
        snapSpeed: 100,
    };

    // Initialize the chessboard
    board = Chessboard('board', boardConfig);

    // Event listener for the "Play Again" button
    document.querySelector('.play-again').addEventListener('click', () => {
        game.reset();
        board.start();
        moveHistory.textContent = '';
        moveCount = 1;
        userColor = 'w';
    });

    // Event listener for the "Set Position" button
    document.querySelector('.set-pos').addEventListener('click', () => {
        const fen = prompt("Enter the FEN notation for the desired position!");
        if (fen !== null) {
            if (game.load(fen)) {
                board.position(fen);
                moveHistory.textContent = '';
                moveCount = 1;
                userColor = 'w';
            } else {
                alert("Invalid FEN notation. Please try again.");
            }
        }
    });

    // Event listener for the "Flip Board" button
    document.querySelector('.flip-board').addEventListener('click', () => {
        board.flip();
        userColor = userColor === 'w' ? 'b' : 'w'; // Toggle user's color after flipping the board
    });
});
