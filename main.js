"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const http_1 = __importDefault(require("http"));
const server = http_1.default.createServer(app);
// import { Server } from "socket.io";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const port = process.env.PORT || 8080;
const socketIO = require("socket.io");
const io = socketIO(server, {
    cors: {
        origin: "*",
    },
});
let currentMultiplier = 1;
let currentTick = 0;
let currentBets = {};
let playerBalances = {};
let currentStep = 0.0006;
let random = Math.floor(Math.random() * 200);
let isWait = true;
function updateGame() {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield sleep(2000);
            isWait = false;
            for (let player in playerBalances) {
                playerBalances[player].canPlaceBet = true;
            }
            yield sleep(5000);
            interval = setInterval(() => updateGame(), 100);
            isWait = true;
        }
    });
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
    socket.on("stop", (x) => {
        if (playerBalances[socket.id].canPlaceBet ||
            playerBalances[socket.id].stopped) {
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
    socket.on("placeBet", function (data) {
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
