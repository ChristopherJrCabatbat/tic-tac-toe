// ============ ELEMENT REFERENCES ============
const board = document.getElementById("board");
const winnerText = document.getElementById("winner");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popup-message");
const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");

// ============ GAME VARIABLES ============
let currentPlayer = "X";
let gameActive = true;
let gameState = Array(9).fill("");

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

// ============ CREATE BOARD ============
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

// ============ HANDLE CLICK ============
function handleClick(e) {
  const index = e.target.dataset.index;
  if (!gameActive || gameState[index] !== "") return;
  if (online && currentPlayer !== mySymbol) return; // Not your turn

  // place move
  gameState[index] = currentPlayer;
  e.target.textContent = currentPlayer;
  e.target.classList.add("placed");

  // check game end locally
  const winner = getWinner();
  if (winner) {
    // highlight immediately for responsiveness and lock out further moves for this client
    highlightWinner();
    gameActive = false; // immediate lock so the player can't keep making moves

    if (online) {
      // notify server (server will broadcast to both players)
      socket.emit("gameOver", { room: roomId, winner });
    } else {
      // offline/local — update immediately and show popup
      endGame(winner, true);
    }
  } else if (!gameState.includes("")) {
    // draw
    gameActive = false;
    if (online) {
      socket.emit("gameOver", { room: roomId, winner: "draw" });
    } else {
      endGame("draw", true);
    }
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    winnerText.textContent = `👉 Player ${currentPlayer}'s Turn`;
  }

  // always send the move when online (server relays to opponent)
  if (online) {
    socket.emit("makeMove", { room: roomId, index, symbol: mySymbol });
  }
}

// ============ CHECK WINNER ============
function getWinner() {
  for (let [a, b, c] of winningConditions) {
    if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
      return gameState[a];
    }
  }
  return null;
}

// ============ HIGHLIGHT WIN ============
function highlightWinner() {
  winningConditions.forEach(([a, b, c]) => {
    if (
      gameState[a] &&
      gameState[a] === gameState[b] &&
      gameState[a] === gameState[c]
    ) {
      const elA = document.querySelector(`[data-index='${a}']`);
      const elB = document.querySelector(`[data-index='${b}']`);
      const elC = document.querySelector(`[data-index='${c}']`);
      if (elA) elA.classList.add("win");
      if (elB) elB.classList.add("win");
      if (elC) elC.classList.add("win");
    }
  });
}

// ============ END GAME ============
function endGame(result, fromServer = false) {
  // If game already locked, don't re-run end logic
  if (!gameActive && !fromServer) {
    // if offline and already ended, nothing to do
    return;
  }

  gameActive = false;

  if (result === "draw") {
    winnerText.textContent = "😮 It's a Draw!";
    showPopup("😮 It's a Draw!");
    return;
  }

  winnerText.textContent = `🎉 Player ${result} Wins!`;

  // Update score only when the result comes from the server (online)
  // or when we're in offline/local mode (fromServer true in that path).
  if (fromServer) {
    updateScore(result);
  }

  showPopup(`🎉 Player ${result} Wins!`);
}

// ============ UPDATE SCORE ============
function updateScore(winner) {
  if (winner === "X") scoreX++;
  else if (winner === "O") scoreO++;
  scoreXDisplay.textContent = `Player X: ${scoreX}`;
  scoreODisplay.textContent = `Player O: ${scoreO}`;
}

// ============ RESET GAME ============
function resetGame() {
  gameState = Array(9).fill("");
  currentPlayer = "X";
  gameActive = true;
  winnerText.textContent = "👉 Player X's Turn";
  createBoard();
}

// ============ POPUP + CONFETTI ============
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

function launchConfetti() {
  let particles = [];
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
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
    if (popup.style.display === "flex") requestAnimationFrame(draw);
  }
  draw();
}

window.addEventListener("resize", () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

// ============ INITIALIZE ============
createBoard();
winnerText.textContent = "👉 Player X's Turn";

// =====================================
//          ONLINE MULTIPLAYER
// =====================================
let socket;
let online = false;
let roomId = null;
let mySymbol = null;

function enableOnlinePlay() {
  socket = io("http://localhost:3000");
  online = true;

  socket.on("waiting", (msg) => {
    winnerText.textContent = msg;
  });

  socket.on("startGame", (data) => {
    roomId = data.room;
    mySymbol = data.symbol;
    resetGame();
    winnerText.textContent = `Game started! You are ${mySymbol}`;
    currentPlayer = "X";
  });

  // opponent's move arrives
  socket.on("opponentMove", ({ index, symbol }) => {
    // if the game already ended on this client, ignore extra moves
    if (!gameActive) return;

    gameState[index] = symbol;
    const cell = document.querySelector(`[data-index='${index}']`);
    if (cell) {
      cell.textContent = symbol;
      cell.classList.add("placed");
    }

    // Do not finalize scoring here — server will broadcast gameOver to both.
    // Just check if board ended and update local UI state (but do not update score).
    const winner = getWinner();
    if (winner) {
      highlightWinner();
      // lock locally — wait for server to broadcast gameOver to trigger score/update
      gameActive = false;
    } else if (!gameState.includes("")) {
      gameActive = false;
    } else {
      // now it's this client's turn
      currentPlayer = mySymbol;
      winnerText.textContent = "👉 Your Turn!";
    }
  });

  // server authoritative final result - broadcast to every player in room
  socket.on("gameOver", (winner) => {
    // only handle if game still active OR if not yet shown
    if (gameActive) {
      // server broadcast for online mode -> update score + popup
      endGame(winner, true);
    } else {
      // If we already locked (gameActive false) but never showed popup/score
      // still call endGame to ensure popup and score are applied exactly once.
      endGame(winner, true);
    }
  });
}
