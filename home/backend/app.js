import express from "express";
import http from "http";
// import https from "https";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import Redis from "ioredis";
import Manager from "./scripts/Manager.js"
import validator from "validator";

// Returns express app and socket
const app = express()
app.use(express.json());
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
    let timeout = 60000 // give the user 60 seconds to input before disconnect
    socket.on("connection", async (socket) => {
        manager.push(socket.id, Date.now() + timeout)
        socket.on("send-data", async (msg) =>{
            const obj = JSON.parse(msg);
            const id = obj.id;
            const ttl = obj.ttl;
            const name = msg.name;
            if (await manager.push(id, ttl)){
                await publisher.publish("data", msg);
            }
        });
        socket.on("name", async (name) => {
            socket.emit("set-name", name);
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
        socket.on("disconnect", async () => {
            await manager.remove(socket.id);
            socket.broadcast.emit("dead", socket.id);
        });
    });
}

await handler(socket);

// app.post("/api/name", async (req, res) => {
//     let { id, name } = req.body;
//     const cleanId = validator.escape(id);
//     const cleanName = validator.escape(name);
//     let redis = await connect();
//     redis.
// });
app.get("/", (req, res) => {
    if (err) res.status(500);
    res.status(200);
});