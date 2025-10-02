const board = document.getElementById("board");
const winnerText = document.getElementById("winner");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popup-message");
const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");

let currentPlayer = "X";
let gameActive = true;
let gameState = ["", "", "", "", "", "", "", "", ""];

// Score tracking
let scoreX = 0;
let scoreO = 0;
const scoreXDisplay = document.getElementById("scoreX");
const scoreODisplay = document.getElementById("scoreO");

confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

const winningConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Create board
function createBoard() {
  board.innerHTML = "";
  gameState.forEach((_, index) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.dataset.index = index;
    div.addEventListener("click", handleClick);
    board.appendChild(div);
  });
}

// Handle click
function handleClick(e) {
  const index = e.target.dataset.index;
  if (gameState[index] !== "" || !gameActive) return;

  gameState[index] = currentPlayer;
  e.target.textContent = currentPlayer;
  e.target.classList.add("placed");

  if (checkWinner()) {
    highlightWinner();
    winnerText.textContent = `🎉 Player ${currentPlayer} Wins!`;
    gameActive = false;
    updateScore();
    showPopup(`🎉 Player ${currentPlayer} Wins!`);
  } else if (!gameState.includes("")) {
    winnerText.textContent = "😮 It's a Draw!";
    gameActive = false;
    showPopup("😮 It's a Draw!");
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    winnerText.textContent = `👉 Player ${currentPlayer}'s Turn`;
  }
}

// Check winner
function checkWinner() {
  return winningConditions.some(
    ([a, b, c]) =>
      gameState[a] &&
      gameState[a] === gameState[b] &&
      gameState[a] === gameState[c]
  );
}

// Highlight winners
function highlightWinner() {
  winningConditions.forEach(([a, b, c]) => {
    if (
      gameState[a] &&
      gameState[a] === gameState[b] &&
      gameState[a] === gameState[c]
    ) {
      document.querySelector(`[data-index='${a}']`).classList.add("win");
      document.querySelector(`[data-index='${b}']`).classList.add("win");
      document.querySelector(`[data-index='${c}']`).classList.add("win");
    }
  });
}

// Update scoreboard
function updateScore() {
  if (currentPlayer === "X") {
    scoreX++;
    scoreXDisplay.textContent = `Player X: ${scoreX}`;
  } else {
    scoreO++;
    scoreODisplay.textContent = `Player O: ${scoreO}`;
  }
}

// Reset game
function resetGame() {
  gameState = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  winnerText.textContent = "👉 Player X's Turn";
  createBoard();
}

// Popup with confetti
function showPopup(message) {
  popupMessage.textContent = message;
  popup.style.display = "flex";
  launchConfetti();
}

function closePopup() {
  popup.style.display = "none";
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  resetGame();
}

// Simple confetti effect
function launchConfetti() {
  let particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      w: 8,
      h: 16,
      color: `hsl(${Math.random() * 360},100%,50%)`,
      speed: Math.random() * 3 + 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      p.y += p.speed;
      if (p.y > confettiCanvas.height) p.y = -20;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

window.addEventListener("resize", () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

createBoard();
winnerText.textContent = "👉 Player X's Turn";
