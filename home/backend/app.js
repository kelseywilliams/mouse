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
const socket = new Server(server, {path: "/mouse/socket.io"});

console.log("Express server on http");
server.listen(3001);
console.log('Express started on port 3001');

const manager = new Manager(socket);

// Returns redis client
async function connect(){
    try {
        const redis = new Redis(process.env.REDIS_URL, {enableReadyCheck: false});
        redis.select(0);
        return redis;
    } catch(e){
        throw new Error(e);
    }

}

async function handler (socket){
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
            socket.broadcast.emit("dead", socket.id);
            manager.remove(id);
        });
    });
    // subscriber.unsubscribe("send-data");
    // subscriber.quit();
    // publisher.quit();
}

await handler(socket);

app.get("/", (req, res) => {
    if (err) res.status(500);
    res.status(200);
});