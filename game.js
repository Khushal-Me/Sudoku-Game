// Game state
let board = Array(9).fill().map(() => Array(9).fill(0));
let solution = Array(9).fill().map(() => Array(9).fill(0));
let initial = Array(9).fill().map(() => Array(9).fill(false));
let selectedCell = null;
let timer = 0;
let timerInterval = null;
let moveHistory = [];
let difficulty = 'medium'; // Default difficulty

// Constants for different difficulties
const DIFFICULTY_SETTINGS = {
    easy: { cellsToRemove: 30 },
    medium: { cellsToRemove: 45 },
    hard: { cellsToRemove: 55 }
};

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    setupGame();
    setupEventListeners();
    loadDarkMode();
});

// Setup all event listeners
function setupEventListeners() {
    // Board cell clicks
    document.getElementById('board').addEventListener('click', handleCellClick);

    // Number buttons
    document.querySelectorAll('.number-btn').forEach(button => {
        button.addEventListener('click', () => handleNumberClick(parseInt(button.textContent)));
    });

    // Game control buttons
    document.getElementById('newGameBtn').addEventListener('click', () => {
        if (confirm('Start a new game?')) {
            setupGame();
        }
    });
    document.getElementById('checkBtn').addEventListener('click', checkSolution);
    document.getElementById('undoBtn').addEventListener('click', handleUndo);
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('highScoreBtn').addEventListener('click', showHighScores);

    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('hidden');
    });
    document.getElementById('cancelSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('hidden');
    });
    document.getElementById('saveSettings').addEventListener('click', () => {
        difficulty = document.getElementById('difficultySelect').value;
        document.getElementById('settingsModal').classList.add('hidden');
        setupGame();
    });

    // High score tabs
    ['easy', 'medium', 'hard'].forEach(diff => {
        document.getElementById(`${diff}Scores`).addEventListener('click', (e) => {
            document.querySelectorAll('[id$="Scores"]').forEach(btn => {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            e.target.classList.remove('bg-gray-200', 'text-gray-700');
            e.target.classList.add('bg-blue-500', 'text-white');
            displayHighScores(diff);
        });
    });

    // Close high scores
    document.getElementById('closeHighScores').addEventListener('click', () => {
        document.getElementById('highScoreModal').classList.add('hidden');
    });
}

// Set up a new game
function setupGame() {
    generateSudoku();
    renderBoard();
    resetTimer();
    startTimer();
    selectedCell = null;
    moveHistory = [];
}

// Generate a valid Sudoku puzzle
function generateSudoku() {
    // Clear the arrays
    board = Array(9).fill().map(() => Array(9).fill(0));
    solution = Array(9).fill().map(() => Array(9).fill(0));
    initial = Array(9).fill().map(() => Array(9).fill(false));

    // Generate solution
    fillBoard(solution);
    
    // Copy solution to board
    board = solution.map(row => [...row]);

    // Remove cells based on difficulty
    const cellsToRemove = DIFFICULTY_SETTINGS[difficulty].cellsToRemove;
    let count = 0;
    while (count < cellsToRemove) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        if (board[row][col] !== 0) {
            board[row][col] = 0;
            count++;
        }
    }

    // Mark initial cells
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            initial[i][j] = board[i][j] !== 0;
        }
    }
}

// Fill the board with valid numbers
function fillBoard(board) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return fillCell(board, 0, 0, numbers);
}

function fillCell(board, row, col, numbers) {
    if (col === 9) {
        row++;
        col = 0;
    }
    if (row === 9) {
        return true;
    }

    if (board[row][col] !== 0) {
        return fillCell(board, row, col + 1, numbers);
    }

    numbers.sort(() => Math.random() - 0.5);

    for (let num of numbers) {
        if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillCell(board, row, col + 1, numbers)) {
                return true;
            }
            board[row][col] = 0;
        }
    }

    return false;
}

// Check if a number is valid in the current position
function isValid(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }

    // Check 3x3 box
    let boxRow = Math.floor(row / 3) * 3;
    let boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[boxRow + i][boxCol + j] === num) return false;
        }
    }

    return true;
}

// Render the Sudoku board
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.className = `
                cell w-12 h-12 flex items-center justify-center font-bold cursor-pointer select-none relative
                border border-gray-300 dark:border-gray-600
                ${initial[i][j] ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${selectedCell?.row === i && selectedCell?.col === j ? 'ring-2 ring-blue-500' : ''}
                ${j % 3 === 0 ? 'border-l-2 border-l-gray-400 dark:border-l-gray-500' : ''}
                ${j === 8 ? 'border-r-2 border-r-gray-400 dark:border-r-gray-500' : ''}
                ${i % 3 === 0 ? 'border-t-2 border-t-gray-400 dark:border-t-gray-500' : ''}
                ${i === 8 ? 'border-b-2 border-b-gray-400 dark:border-b-gray-500' : ''}
                ${!initial[i][j] && board[i][j] !== 0 ? 'text-blue-600 dark:text-blue-400' : ''}
            `;
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = board[i][j] || '';
            boardElement.appendChild(cell);
        }
    }
}

// Handle cell click
function handleCellClick(event) {
    const cell = event.target.closest('.cell');
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (initial[row][col]) return;

    selectedCell = { row, col };
    renderBoard();
}

// Handle number click
function handleNumberClick(number) {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    if (initial[row][col]) return;

    // Toggle number
    if (board[row][col] === number) {
        moveHistory.push({ row, col, oldValue: number, newValue: 0 });
        board[row][col] = 0;
    } else {
        moveHistory.push({ row, col, oldValue: board[row][col], newValue: number });
        board[row][col] = number;
    }

    renderBoard();
}

// Handle undo
function handleUndo() {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory.pop();
    board[lastMove.row][lastMove.col] = lastMove.oldValue;
    renderBoard();
}

// Check solution
function checkSolution() {
    let isFilled = true;
    let isCorrect = true;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === 0) {
                isFilled = false;
                break;
            }
            if (board[i][j] !== solution[i][j]) {
                isCorrect = false;
                break;
            }
        }
        if (!isFilled || !isCorrect) break;
    }

    if (!isFilled) {
        alert('Please fill in all cells before checking!');
    } else if (!isCorrect) {
        alert('Some numbers are incorrect. Keep trying!');
    } else {
        stopTimer();
        const score = timer;
        alert(`Congratulations! You solved it in ${score} seconds!`);
        saveHighScore(score);
        setupGame();
    }
}

// Timer functions
function startTimer() {
    timer = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timer++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    timer = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    document.getElementById('timer').textContent = timer;
}

// High score functions
function saveHighScore(score) {
    const highScores = JSON.parse(localStorage.getItem(`highScores_${difficulty}`) || '[]');
    highScores.push(score);
    highScores.sort((a, b) => a - b);
    highScores.splice(10); // Keep only top 10
    localStorage.setItem(`highScores_${difficulty}`, JSON.stringify(highScores));
}

function showHighScores() {
    document.getElementById('highScoreModal').classList.remove('hidden');
    displayHighScores(difficulty);
}

function displayHighScores(diff) {
    const highScores = JSON.parse(localStorage.getItem(`highScores_${diff}`) || '[]');
    const highScoreList = document.getElementById('highScoreList');
    highScoreList.innerHTML = '';

    if (highScores.length === 0) {
        const div = document.createElement('div');
        div.className = 'text-center text-gray-600 dark:text-gray-400';
        div.textContent = 'No high scores yet!';
        highScoreList.appendChild(div);
        return;
    }

    highScores.forEach((score, index) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded';
        div.innerHTML = `
            <span class="font-bold">#${index + 1}</span>
            <span>${score} seconds</span>
        `;
        highScoreList.appendChild(div);
    });
}

// Dark mode functions
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

function loadDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
    }
}
