import express from "express";
const app = express();
import http from "http";

const server = http.createServer(app);
import { Server } from "socket.io";

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.static("public"));

io.on("connection", function (socket) {
  console.log("a user connected");

  // handle disconnections
  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});

server.listen(8080, function () {
  console.log("listening on *:8080");
});

interface ICurrentBets {
  [key: string]: number;
}

interface ICurrentUsers {
  [key: string]: number;
}

let currentMultiplier = 1;
let currentTick = 0;
let currentBets: ICurrentBets = {};

let currentStep = 0.0006;
let random = Math.floor(Math.random() * 500);
function updateGame() {
  currentMultiplier += currentStep;
  currentTick++;

  io.emit("gameState", {
    multiplier: +currentMultiplier.toFixed(2),
    tick: currentTick,
  });
  currentStep += 0.0006;

  if (currentTick >= random) {
    // game has crashed
    for (let socketId in currentBets) {
      let betAmount = currentBets[socketId];
      console.log(currentBets);

      io.to(socketId).emit("betResult", {
        multiplier: currentMultiplier,
        winnings: betAmount * currentMultiplier,
      });
    }
    io.emit("crash");
    currentMultiplier = 1;
    currentTick = 0;
    currentBets = {};
    currentStep = 0.0006;
    random = Math.floor(Math.random() * 500);
  }
}

let interval = setInterval(updateGame, 100);

io.on("connection", function (socket) {
  console.log("a user connected");

  socket.on("placeBet", function (data) {
    currentBets[socket.id] = data.amount;
  });

  socket.on("crash", (data) => {
    clearInterval(interval);
    socket.emit("bid");
    setTimeout(() => {
      interval = setInterval(updateGame, 100);
    }, 5000);
  });

  socket.on("disconnect", function () {
    console.log("user disconnected");
    delete currentBets[socket.id];
  });
});
