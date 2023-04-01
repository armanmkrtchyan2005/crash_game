import express from "express";
const app = express();
import http from "http";
import { Socket } from "socket.io";
const server = http.createServer(app);
import { setTimeout as sleep } from "timers/promises";
// import { Server } from "socket.io";

const port = process.env.PORT || 8080;

const socketIO = require("socket.io");

const io: Socket = socketIO(server, {
  cors: {
    origin: "*",
  },
});

interface ICurrentBets {
  [key: string]: number;
}
interface IPlayers {
  [key: string]: {
    balance: number;
    multiplyX: number;
    stopped: boolean;
    canPlaceBet: boolean;
  };
}

let currentMultiplier = 1;
let currentTick = 0;
let currentBets: ICurrentBets = {};
let playerBalances: IPlayers = {};
let currentStep = 0.0006;
let random = Math.floor(Math.random() * 200);

let isWait = true;

async function updateGame() {
  currentMultiplier += currentStep;
  currentTick++;

  io.emit("gameState", {
    multiplier: +currentMultiplier.toFixed(2),
    tick: currentTick,
  });
  1 + 0.0006 + 0.0006 * 2 + 0.0006 * 3;
  currentStep += 0.0006;

  if (currentTick >= random) {
    currentTick = 0;
    currentMultiplier = 1;
    currentBets = {};
    currentStep = 0.0006;
    random = Math.floor(Math.random() * 200);
    clearInterval(interval);
    1 + 0.0006 * (1 + 2 + 3 + 4 + 5);
    const k = 1 + currentStep * (((1 + random) / 2) * random);
    io.emit("k", +k.toFixed(2));
    io.emit("stopDisabled");
    for (let player in playerBalances) {
      playerBalances[player].stopped = false;
    }
    await sleep(2000);
    isWait = false;
    for (let player in playerBalances) {
      playerBalances[player].canPlaceBet = true;
    }
    await sleep(5000);
    interval = setInterval(() => updateGame(), 100);
    isWait = true;
  }
}

let interval = setInterval(() => updateGame(), 100);

io.on("connection", function (socket) {
  console.log("a user connected");
  playerBalances[socket.id] = {
    balance: 1000,
    multiplyX: 1,
    stopped: true,
    canPlaceBet: true,
  };

  socket.on("stop", (x: number) => {
    if (
      playerBalances[socket.id].canPlaceBet ||
      playerBalances[socket.id].stopped
    ) {
      return;
    }
    playerBalances[socket.id].balance += currentBets[socket.id] * x;

    io.to(socket.id).emit("balanceUpdate", {
      balance: playerBalances[socket.id].balance,
    });

    playerBalances[socket.id].stopped = true;
  });

  io.to(socket.id).emit("balanceUpdate", {
    balance: playerBalances[socket.id].balance,
  });

  socket.on("placeBet", function (data: any) {
    if (isWait) {
      return;
    }

    if (!playerBalances[socket.id].canPlaceBet) {
      io.to(socket.id).emit("betDisabled");
      io.to(socket.id).emit("stopDisabled");
      return;
    }
    if (playerBalances[socket.id] < data.amount) {
      io.to(socket.id).emit("insufficientFunds");
      return;
    }
    playerBalances[socket.id].balance -= data.amount;
    currentBets[socket.id] = data.amount;
    io.to(socket.id).emit("balanceUpdate", {
      balance: playerBalances[socket.id].balance,
    });
    playerBalances[socket.id].canPlaceBet = false;
  });

  socket.on("disconnect", function () {
    console.log("user disconnected");
    delete currentBets[socket.id];
    delete playerBalances[socket.id];
  });
});

server.listen(port, function () {
  console.log(`listening on *:${port}`);
});
