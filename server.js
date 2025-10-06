const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the current folder
app.use(express.static(path.join(__dirname)));

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  if (waitingPlayer) {
    const room = `room-${waitingPlayer.id}-${socket.id}`;
    socket.join(room);
    waitingPlayer.join(room);

    io.to(room).emit("startGame", {
      room,
      symbol: "O",
      opponent: waitingPlayer.id,
    });
    waitingPlayer.emit("startGame", {
      room,
      symbol: "X",
      opponent: socket.id,
    });

    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit("waiting", "Waiting for another player...");
  }

  socket.on("makeMove", ({ room, index, symbol }) => {
    socket.to(room).emit("opponentMove", { index, symbol });
  });

  socket.on("gameOver", ({ room, winner }) => {
    io.to(room).emit("gameOver", winner); // <-- broadcast to everyone in the room
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

server.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
