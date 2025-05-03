import express from "express";
import http from "http";
// import https from "https";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import Redis from "ioredis";
import Manager from "./scripts/Manager.js"

// Returns express app and socket
const app = express()
app.use(express.static("frontend"));
const server = http.createServer(app);
const socket = new Server(server);

server.listen(3001);
console.log("Express server on http on port 3001");

async function connect(){
    const redis = new Redis(process.env.REDIS_URL, {enableReadyCheck: false});
    redis.select(0);
    redis.on('error', err => {
        console.warn('A fatal error occured while trying to connect to the database.  (Is it on?)')
        process.exit(1);
    })
    return redis;
}


async function handler (socket){
    const manager = new Manager(socket, await connect());
    const publisher = await connect();
    const subscriber = await connect();
    socket.on("connection", async (socket) => {
        socket.on("send-data", async (msg) =>{
            const obj = JSON.parse(msg);
            const id = obj.id;
            const ttl = obj.ttl;
            if (await manager.push(id, ttl)){
                await publisher.publish("data", msg);
            }
        });
        subscriber.subscribe("data", (err) => {
            if (err){
                console.log("Error subscribing to redis channel: data: " + err);
            }
        });
        subscriber.on("message", (channel, msg) => {
            if (channel == "data"){
                const id = JSON.parse(msg).id;
                socket.except(id).emit("get-data", msg);
            }
        });
        socket.on("disconnect", () => {
            manager.remove(socket.id);
            socket.broadcast.emit("dead", socket.id);
        });
    });
}

await handler(socket);


app.get("/", (req, res) => {
    if (err) res.status(500);
    res.status(200);
});